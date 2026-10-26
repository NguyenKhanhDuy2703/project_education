-- CreateTable
CREATE TABLE IF NOT EXISTS "user_saved_series" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_saved_series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_saved_series_userId_seriesId_key" ON "user_saved_series"("userId", "seriesId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_saved_series_userId_idx" ON "user_saved_series"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_saved_series_seriesId_idx" ON "user_saved_series"("seriesId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "user_saved_series" ADD CONSTRAINT "user_saved_series_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "user_saved_series" ADD CONSTRAINT "user_saved_series_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "lab_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
