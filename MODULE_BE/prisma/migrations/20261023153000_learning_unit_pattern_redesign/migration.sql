-- CreateEnum
CREATE TYPE "LearningUnitType" AS ENUM ('theory', 'sql_practice', 'quiz_checkpoint', 'automation_lab');

-- CreateEnum
CREATE TYPE "LearningProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "labs" ADD COLUMN "sectionId" TEXT;
ALTER TABLE "labs" ADD COLUMN "unitType" "LearningUnitType";

-- CreateTable
CREATE TABLE "series_sections" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "series_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_unit_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "status" "LearningProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "lastPosition" JSONB,
    "score" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_unit_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "series_sections_seriesId_orderIndex_idx" ON "series_sections"("seriesId", "orderIndex");

-- CreateIndex
CREATE INDEX "learning_unit_progress_userId_status_idx" ON "learning_unit_progress"("userId", "status");

-- CreateIndex
CREATE INDEX "learning_unit_progress_labId_idx" ON "learning_unit_progress"("labId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_unit_progress_userId_labId_key" ON "learning_unit_progress"("userId", "labId");

-- AddForeignKey
ALTER TABLE "labs" ADD CONSTRAINT "labs_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "series_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_sections" ADD CONSTRAINT "series_sections_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "lab_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_unit_progress" ADD CONSTRAINT "learning_unit_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_unit_progress" ADD CONSTRAINT "learning_unit_progress_labId_fkey" FOREIGN KEY ("labId") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Deterministic Backfill: Infer unitType from sandboxType
UPDATE "labs"
SET "unitType" = CASE
    WHEN "sandboxType" = 'markdown_only' THEN 'theory'::"LearningUnitType"
    WHEN "sandboxType" = 'sql_worker' THEN 'sql_practice'::"LearningUnitType"
    WHEN "sandboxType" = 'quizlet' THEN 'quiz_checkpoint'::"LearningUnitType"
    WHEN "sandboxType" IN ('js_worker', 'automation_v3') THEN 'automation_lab'::"LearningUnitType"
    ELSE 'theory'::"LearningUnitType"
END
WHERE "unitType" IS NULL;

-- Deterministic Backfill: Sync completed progress from passed lab_submissions
INSERT INTO "learning_unit_progress" ("id", "userId", "labId", "status", "completedAt", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    s."userId",
    s."labId",
    'COMPLETED'::"LearningProgressStatus",
    MIN(s."createdAt"),
    MIN(s."createdAt"),
    NOW()
FROM "lab_submissions" s
WHERE s."status" = 'passed'
GROUP BY s."userId", s."labId"
ON CONFLICT ("userId", "labId") DO UPDATE
SET "status" = 'COMPLETED',
    "completedAt" = EXCLUDED."completedAt",
    "updatedAt" = NOW();
