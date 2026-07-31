-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "variantId" TEXT;

-- CreateIndex
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "shippingFee" DECIMAL(65,30) NOT NULL DEFAULT 99,
    "freeShippingThreshold" DECIMAL(65,30) NOT NULL DEFAULT 4000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- Seed default shipping settings
INSERT INTO "SiteSettings" ("id", "shippingFee", "freeShippingThreshold", "updatedAt")
VALUES ('default', 99, 4000, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
