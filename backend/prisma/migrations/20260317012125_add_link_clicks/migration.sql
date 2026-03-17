-- CreateTable
CREATE TABLE "LinkClick" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "linkId" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "referer" TEXT,
    "country" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LinkClick_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LinkClick_linkId_idx" ON "LinkClick"("linkId");

-- CreateIndex
CREATE INDEX "LinkClick_createdAt_idx" ON "LinkClick"("createdAt");
