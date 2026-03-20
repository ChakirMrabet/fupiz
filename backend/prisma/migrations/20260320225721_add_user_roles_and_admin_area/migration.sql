-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeSubscriptionStatus" TEXT,
    "stripeCurrentPeriodEnd" DATETIME,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "activationToken" TEXT,
    "activationTokenExpiresAt" DATETIME,
    "activatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("activatedAt", "activationToken", "activationTokenExpiresAt", "cancelAtPeriodEnd", "createdAt", "email", "id", "isActive", "name", "password", "plan", "stripeCurrentPeriodEnd", "stripeCustomerId", "stripePriceId", "stripeSubscriptionId", "stripeSubscriptionStatus", "updatedAt") SELECT "activatedAt", "activationToken", "activationTokenExpiresAt", "cancelAtPeriodEnd", "createdAt", "email", "id", "isActive", "name", "password", "plan", "stripeCurrentPeriodEnd", "stripeCustomerId", "stripePriceId", "stripeSubscriptionId", "stripeSubscriptionStatus", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");
CREATE UNIQUE INDEX "User_activationToken_key" ON "User"("activationToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
