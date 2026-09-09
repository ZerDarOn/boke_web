-- Revoke all previously issued tokens after rollout by requiring a persisted
-- session version in every newly issued access and refresh token.
ALTER TABLE "users"
ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
