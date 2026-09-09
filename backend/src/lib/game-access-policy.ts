import type { Prisma } from '@prisma/client';
import type { AuthPayload } from '../types';

type GameViewer = Pick<AuthPayload, 'role'> | undefined;

export function canIncludeHiddenGames(
  includeHiddenRequested: boolean,
  viewer: GameViewer
): boolean {
  return includeHiddenRequested && viewer?.role === 'ADMIN';
}

export function buildGameLookupWhere(
  id: string,
  includeHidden: boolean
): Prisma.GameWhereInput {
  return {
    id,
    ...(!includeHidden && { isHidden: false }),
  };
}
