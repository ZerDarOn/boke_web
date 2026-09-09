import { PassThrough, type Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ServerResponse } from 'node:http';

/**
 * Stream a readable into an HTTP response without letting pipeline destroy the
 * response before callers can render a JSON error for a pre-body source error.
 * Once any body bytes were sent, the only safe failure behavior is to close the
 * partial response.
 */
export async function pipeReadableToResponse(
  source: Readable,
  response: ServerResponse
): Promise<void> {
  const gateway = new PassThrough();
  const handleResponseClose = () => {
    if (!response.writableEnded && !source.destroyed) {
      source.destroy(new Error('HTTP response closed before the source stream completed'));
    }
  };

  response.once('close', handleResponseClose);
  gateway.pipe(response);

  try {
    await pipeline(source, gateway);
  } catch (error) {
    gateway.unpipe(response);
    if (response.headersSent && !response.destroyed) {
      response.destroy();
    }
    throw error;
  } finally {
    response.off('close', handleResponseClose);
  }
}
