-- AlterTable
ALTER TABLE "DestinationGuide" ADD COLUMN     "bandBody" TEXT,
ADD COLUMN     "bandNote" TEXT,
ADD COLUMN     "bandTag" TEXT,
ADD COLUMN     "bandTagTone" TEXT,
ADD COLUMN     "chipLabel" TEXT,
ADD COLUMN     "featuredOffers" JSONB,
ADD COLUMN     "gettingAround" JSONB,
ADD COLUMN     "heroHeadline" TEXT,
ADD COLUMN     "heroKicker" TEXT,
ADD COLUMN     "heroSub" TEXT,
ADD COLUMN     "onHomepage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "DestinationGuide_onHomepage_sortOrder_idx" ON "DestinationGuide"("onHomepage", "sortOrder");
