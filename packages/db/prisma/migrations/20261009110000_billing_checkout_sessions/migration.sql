-- Preserve every checkout reference_id so superseded Xendit sessions still resolve on webhook.
CREATE TABLE "billing_checkout_sessions" (
    "provider_reference" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_checkout_sessions_pkey" PRIMARY KEY ("provider_reference")
);

CREATE INDEX "billing_checkout_sessions_workspace_id_created_at_idx"
  ON "billing_checkout_sessions"("workspace_id", "created_at");

ALTER TABLE "billing_checkout_sessions" ADD CONSTRAINT "billing_checkout_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "billing_checkout_sessions" ADD CONSTRAINT "billing_checkout_sessions_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "billing_checkout_sessions" ("provider_reference", "user_id", "workspace_id", "created_at")
SELECT "provider_reference", "user_id", "workspace_id", COALESCE("created_at", CURRENT_TIMESTAMP)
FROM "subscriptions"
WHERE "provider_reference" IS NOT NULL;
