export interface CursorConfig {
  enabled: boolean;
  trailEnabled: boolean;
  default: string;
  pointer: string;
  text: string;
  move: string;
  resizeHorizontal: string;
  resizeVertical: string;
  resizeDiagonal1: string;
  resizeDiagonal2: string;
}

export const defaultCursorConfig: CursorConfig = {
  enabled: true,
  trailEnabled: false,
  default: '/cursors/ori-2/default.cur',
  pointer: '/cursors/ori-2/pointer.cur',
  text: '/cursors/ori-2/text.cur',
  move: '/cursors/ori-2/move.cur',
  resizeHorizontal: '/cursors/ori-2/resize-horizontal.cur',
  resizeVertical: '/cursors/ori-2/resize-vertical.cur',
  resizeDiagonal1: '/cursors/ori-2/resize-diagonal-1.cur',
  resizeDiagonal2: '/cursors/ori-2/resize-diagonal-2.cur',
};

export function toCursorCssValue(url: string, fallback: string): string {
  const isManagedCursor = url.startsWith('/cursors/') || url.startsWith('/uploads/cursors/');
  if (!isManagedCursor) return fallback;

  const safeUrl = url.replace(/["'()\\\n\r]/g, '');
  return `url("${safeUrl}"), ${fallback}`;
}
