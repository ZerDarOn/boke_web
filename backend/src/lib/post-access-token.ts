import jwt from 'jsonwebtoken';
import { config } from '../config/env';

const POST_ACCESS_TOKEN_TYPE = 'post-access';
const POST_ACCESS_TOKEN_EXPIRES_IN = '24h';

interface PostAccessPayload {
  postId: string;
  type: typeof POST_ACCESS_TOKEN_TYPE;
}

export function createPostAccessToken(postId: string): string {
  return jwt.sign(
    { postId, type: POST_ACCESS_TOKEN_TYPE },
    config.JWT_SECRET,
    { expiresIn: POST_ACCESS_TOKEN_EXPIRES_IN }
  );
}

export function verifyPostAccessToken(token: string | undefined, postId: string): boolean {
  if (!token) return false;

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as PostAccessPayload;
    return payload.type === POST_ACCESS_TOKEN_TYPE && payload.postId === postId;
  } catch {
    return false;
  }
}
