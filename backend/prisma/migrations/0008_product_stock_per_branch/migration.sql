-- Products become a shared catalog; stock/reorder move to a per-branch join table.

-- 1. Create the new join table.
CREATE TABLE "product_branch_stocks" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_branch_stocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_branch_stocks_productId_branchId_key"
    ON "product_branch_stocks"("productId", "branchId");
CREATE INDEX "product_branch_stocks_branchId_idx"
    ON "product_branch_stocks"("branchId");

ALTER TABLE "product_branch_stocks"
    ADD CONSTRAINT "product_branch_stocks_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_branch_stocks"
    ADD CONSTRAINT "product_branch_stocks_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Copy existing per-branch product rows into the new table so we don't lose
--    stock counts. gen_random_uuid() is available in Postgres 13+ (Railway uses 15).
INSERT INTO "product_branch_stocks" ("id", "productId", "branchId", "stock", "reorderLevel", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", "branchId", "stock", "reorderLevel", "createdAt", "updatedAt"
FROM "products";

-- 3. Drop the columns that moved.
ALTER TABLE "products" DROP CONSTRAINT "products_branchId_fkey";
DROP INDEX IF EXISTS "products_branchId_idx";
ALTER TABLE "products" DROP COLUMN "branchId";
ALTER TABLE "products" DROP COLUMN "stock";
ALTER TABLE "products" DROP COLUMN "reorderLevel";
