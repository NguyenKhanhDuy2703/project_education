import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Task 1.2: Billing Migration & Seed Idempotency Suite', () => {
  const seedPath = path.resolve(__dirname, '../prisma/seed.ts');
  const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
  const migrationPath = path.resolve(
    __dirname,
    '../prisma/migrations/20261026120000_add_billing_notifications_jobs/migration.sql',
  );

  it('Verifies migration SQL creates all billing and notification tables, enums, and indexes', () => {
    assert.ok(fs.existsSync(migrationPath), 'Migration file must exist');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Required tables
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS "upgrade_requests"'));
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS "billing_settings"'));
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS "notifications"'));
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS "announcements"'));
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS "announcement_recipients"'));
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS "scheduled_job_leases"'));

    // Required enums
    assert.ok(sql.includes('CREATE TYPE "UpgradeRequestStatus"'));
    assert.ok(sql.includes('CREATE TYPE "NotificationType"'));
    assert.ok(sql.includes('CREATE TYPE "AnnouncementStatus"'));

    // Plan column additions
    assert.ok(sql.includes('ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "isPublic"'));
    assert.ok(sql.includes('ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "isSaleReady"'));

    // Required unique constraints
    assert.ok(sql.includes('CREATE UNIQUE INDEX IF NOT EXISTS "upgrade_requests_transferReference_key"'));
    assert.ok(sql.includes('CREATE UNIQUE INDEX IF NOT EXISTS "upgrade_requests_verifiedBankReference_key"'));
    assert.ok(sql.includes('CREATE UNIQUE INDEX IF NOT EXISTS "notifications_eventKey_key"'));
    assert.ok(sql.includes('CREATE UNIQUE INDEX IF NOT EXISTS "announcement_recipients_announcementId_userId_key"'));
  });

  it('Verifies seed.ts preserves operator-managed prices and configuration on rerun', () => {
    assert.ok(fs.existsSync(seedPath), 'seed.ts must exist');
    const seedContent = fs.readFileSync(seedPath, 'utf-8');

    // Check plan upserts use update: {} so re-running seed does NOT overwrite edited prices
    const proMonthlyMatch = seedContent.match(/where:\s*\{\s*code:\s*'PRO_MONTHLY'\s*\},\s*update:\s*\{\}/);
    assert.ok(proMonthlyMatch, 'PRO_MONTHLY upsert must have empty update: {} to protect operator price edits');

    const proYearlyMatch = seedContent.match(/where:\s*\{\s*code:\s*'PRO_YEARLY'\s*\},\s*update:\s*\{\}/);
    assert.ok(proYearlyMatch, 'PRO_YEARLY upsert must have empty update: {} to protect operator price edits');

    // Check billingSettings upsert uses update: {}
    const billingSettingsMatch = seedContent.match(/prisma\.billingSettings\.upsert\(\{\s*where:\s*\{\s*id:\s*'default'\s*\},\s*update:\s*\{\}/);
    assert.ok(billingSettingsMatch, 'billingSettings upsert must have empty update: {} to protect operator bank settings');

    // Default configuration: PRO_MONTHLY is not sale ready until operator confirms
    assert.ok(seedContent.includes("isSaleReady: false"), 'Default PRO_MONTHLY must default isSaleReady to false');
    assert.ok(seedContent.includes("isIntakeEnabled: false"), 'Default billingSettings must default isIntakeEnabled to false');
  });

  it('Verifies schema.prisma defines required relations and constraints for UpgradeRequest and Notification', () => {
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // UpgradeRequest model checks
    assert.ok(schema.includes('model UpgradeRequest {'));
    assert.ok(schema.includes('transferReference     String               @unique'));
    assert.ok(schema.includes('verifiedBankReference String?              @unique'));
    assert.ok(schema.includes('user                  User                 @relation("UserUpgradeRequests"'));
    assert.ok(schema.includes('reviewedBy            User?                @relation("ReviewedUpgradeRequests"'));

    // Notification model checks
    assert.ok(schema.includes('model Notification {'));
    assert.ok(schema.includes('eventKey   String?          @unique'));
    assert.ok(schema.includes('readAt     DateTime?'));

    // BillingSettings model checks
    assert.ok(schema.includes('model BillingSettings {'));
    assert.ok(schema.includes('isIntakeEnabled Boolean  @default(false)'));

    // ScheduledJobLease checks
    assert.ok(schema.includes('model ScheduledJobLease {'));
    assert.ok(schema.includes('jobName    String   @id'));
  });
});
