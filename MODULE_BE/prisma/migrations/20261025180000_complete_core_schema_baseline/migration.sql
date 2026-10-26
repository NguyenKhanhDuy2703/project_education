-- CreateEnum FeatureCategory
DO $$ BEGIN
    CREATE TYPE "FeatureCategory" AS ENUM ('lab_execution', 'content_access', 'ai_assistant', 'system_operation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum OverrideEffect
DO $$ BEGIN
    CREATE TYPE "OverrideEffect" AS ENUM ('ALLOW', 'DENY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum BillingCycle
DO $$ BEGIN
    CREATE TYPE "BillingCycle" AS ENUM ('FREE', 'MONTHLY', 'YEARLY', 'LIFETIME');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum SubscriptionStatus
DO $$ BEGIN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'TRIAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum FeedbackCategory
DO $$ BEGIN
    CREATE TYPE "FeedbackCategory" AS ENUM ('bug', 'feature_request', 'content_lab', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable features
CREATE TABLE IF NOT EXISTS "features" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "FeatureCategory" NOT NULL DEFAULT 'content_access',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "features_code_key" ON "features"("code");

-- CreateTable permissions
CREATE TABLE IF NOT EXISTS "permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "permissions_code_key" ON "permissions"("code");

-- CreateTable subscription_plans
CREATE TABLE IF NOT EXISTS "subscription_plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'FREE',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_plans_code_key" ON "subscription_plans"("code");

-- CreateTable plan_features
CREATE TABLE IF NOT EXISTS "plan_features" (
    "planId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "limitValue" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("planId","featureId")
);

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable plan_permissions
CREATE TABLE IF NOT EXISTS "plan_permissions" (
    "planId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_permissions_pkey" PRIMARY KEY ("planId","permissionId")
);

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "plan_permissions" ADD CONSTRAINT "plan_permissions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "plan_permissions" ADD CONSTRAINT "plan_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable user_groups
CREATE TABLE IF NOT EXISTS "user_groups" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_groups_code_key" ON "user_groups"("code");

-- CreateTable user_group_members
CREATE TABLE IF NOT EXISTS "user_group_members" (
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_group_members_pkey" PRIMARY KEY ("userId","groupId")
);

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable group_plans
CREATE TABLE IF NOT EXISTS "group_plans" (
    "groupId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_plans_pkey" PRIMARY KEY ("groupId","planId")
);

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "group_plans" ADD CONSTRAINT "group_plans_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "group_plans" ADD CONSTRAINT "group_plans_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable user_subscriptions
CREATE TABLE IF NOT EXISTS "user_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_subscriptions_userId_status_idx" ON "user_subscriptions"("userId", "status");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable user_feature_overrides
CREATE TABLE IF NOT EXISTS "user_feature_overrides" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "effect" "OverrideEffect" NOT NULL,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_feature_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_feature_overrides_userId_featureId_key" ON "user_feature_overrides"("userId", "featureId");
CREATE INDEX IF NOT EXISTS "user_feature_overrides_userId_effect_idx" ON "user_feature_overrides"("userId", "effect");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "user_feature_overrides" ADD CONSTRAINT "user_feature_overrides_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "user_feature_overrides" ADD CONSTRAINT "user_feature_overrides_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable audit_logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "audit_logs_targetUserId_createdAt_idx" ON "audit_logs"("targetUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable feedbacks
CREATE TABLE IF NOT EXISTS "feedbacks" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "category" "FeedbackCategory" NOT NULL DEFAULT 'other',
    "message" TEXT NOT NULL,
    "pageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "feedbacks_category_createdAt_idx" ON "feedbacks"("category", "createdAt");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable contributor_applications
CREATE TABLE IF NOT EXISTS "contributor_applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "portfolioUrl" TEXT,
    "sampleTopic" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contributor_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "contributor_applications_userId_status_idx" ON "contributor_applications"("userId", "status");
CREATE INDEX IF NOT EXISTS "contributor_applications_status_createdAt_idx" ON "contributor_applications"("status", "createdAt");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "contributor_applications" ADD CONSTRAINT "contributor_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "contributor_applications" ADD CONSTRAINT "contributor_applications_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
