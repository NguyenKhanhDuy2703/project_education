-- CreateEnum UpgradeRequestStatus
DO $$ BEGIN
    CREATE TYPE "UpgradeRequestStatus" AS ENUM ('AWAITING_PAYMENT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum NotificationType
DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM (
        'UPGRADE_REQUEST_CREATED',
        'PAYMENT_SUBMITTED',
        'UPGRADE_APPROVED',
        'UPGRADE_REJECTED',
        'MEMBERSHIP_EXPIRING_SOON',
        'MEMBERSHIP_EXPIRED',
        'CONTENT_REVIEW_APPROVED',
        'CONTENT_REVIEW_CHANGES_REQUESTED',
        'CONTENT_REVIEW_REJECTED',
        'CONTENT_REVIEW_PUBLISHED',
        'ANNOUNCEMENT',
        'SYSTEM'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum AnnouncementStatus
DO $$ BEGIN
    CREATE TYPE "AnnouncementStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable subscription_plans
ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "isSaleReady" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable upgrade_requests
CREATE TABLE IF NOT EXISTS "upgrade_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "UpgradeRequestStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "transferReference" TEXT NOT NULL,
    "priceSnapshot" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "period" TEXT NOT NULL DEFAULT 'MONTHLY',
    "bankSnapshot" JSONB NOT NULL,
    "paymentReference" TEXT,
    "paymentSubmittedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewReason" TEXT,
    "verifiedAmount" DECIMAL(10,2),
    "verifiedBankReference" TEXT,
    "subscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upgrade_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable billing_settings
CREATE TABLE IF NOT EXISTS "billing_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "bankName" TEXT NOT NULL DEFAULT '',
    "bankCode" TEXT NOT NULL DEFAULT '',
    "accountNumber" TEXT NOT NULL DEFAULT '',
    "accountHolder" TEXT NOT NULL DEFAULT '',
    "instructions" TEXT,
    "isIntakeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable notifications
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "actionPath" TEXT,
    "eventKey" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable announcements
CREATE TABLE IF NOT EXISTS "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "actionPath" TEXT,
    "targetAudience" TEXT NOT NULL DEFAULT 'ALL',
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "processedRecipients" INTEGER NOT NULL DEFAULT 0,
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable announcement_recipients
CREATE TABLE IF NOT EXISTS "announcement_recipients" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationId" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable scheduled_job_leases
CREATE TABLE IF NOT EXISTS "scheduled_job_leases" (
    "jobName" TEXT NOT NULL,
    "lockedBy" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "lastResult" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_job_leases_pkey" PRIMARY KEY ("jobName")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "upgrade_requests_transferReference_key" ON "upgrade_requests"("transferReference");
CREATE UNIQUE INDEX IF NOT EXISTS "upgrade_requests_verifiedBankReference_key" ON "upgrade_requests"("verifiedBankReference");
CREATE INDEX IF NOT EXISTS "upgrade_requests_userId_status_idx" ON "upgrade_requests"("userId", "status");
CREATE INDEX IF NOT EXISTS "upgrade_requests_status_createdAt_idx" ON "upgrade_requests"("status", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "upgrade_requests_user_open_unique_idx" ON "upgrade_requests"("userId") WHERE "status" IN ('AWAITING_PAYMENT', 'PENDING_REVIEW');

CREATE UNIQUE INDEX IF NOT EXISTS "notifications_eventKey_key" ON "notifications"("eventKey");
CREATE INDEX IF NOT EXISTS "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");
CREATE INDEX IF NOT EXISTS "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "announcements_status_createdAt_idx" ON "announcements"("status", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "announcement_recipients_announcementId_userId_key" ON "announcement_recipients"("announcementId", "userId");
CREATE INDEX IF NOT EXISTS "announcement_recipients_announcementId_deliveredAt_idx" ON "announcement_recipients"("announcementId", "deliveredAt");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "upgrade_requests" ADD CONSTRAINT "upgrade_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "upgrade_requests" ADD CONSTRAINT "upgrade_requests_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "upgrade_requests" ADD CONSTRAINT "upgrade_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "upgrade_requests" ADD CONSTRAINT "upgrade_requests_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "user_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "announcements" ADD CONSTRAINT "announcements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "announcement_recipients" ADD CONSTRAINT "announcement_recipients_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "announcement_recipients" ADD CONSTRAINT "announcement_recipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
