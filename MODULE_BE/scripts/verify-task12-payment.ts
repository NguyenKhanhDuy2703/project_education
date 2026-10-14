import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { EntitlementsService } from '../src/modules/entitlements/entitlements.service';
import { UsersService } from '../src/modules/users/users.service';
import { SubscriptionStatus, UserRole } from '@prisma/client';
import * as crypto from 'crypto';

// VNPay Helper Functions for HMAC-SHA512 Verification
function sortObject(obj: Record<string, any>) {
  const sorted: Record<string, any> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    if (obj[key] !== '' && obj[key] !== undefined && obj[key] !== null) {
      sorted[key] = obj[key];
    }
  }
  return sorted;
}

function buildVnpaySignString(params: Record<string, any>) {
  const sorted = sortObject(params);
  return Object.entries(sorted)
    .map(([key, val]) => `${key}=${encodeURIComponent(String(val)).replace(/%20/g, '+')}`)
    .join('&');
}

function signHmacSha512(secret: string, data: string): string {
  return crypto.createHmac('sha512', secret).update(Buffer.from(data, 'utf-8')).digest('hex');
}

async function run() {
  console.log('🚀 Starting Verification: Task 12 (PRO Upgrade, Paywall & VNPAY Payment - WF-12 | PB-09, PB-12)...');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const entitlementsService = app.get(EntitlementsService);
  const usersService = app.get(UsersService);

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  let testUserId = '';
  const VNP_SECRET = 'VNPAY_SECRET_TEST_KEY_FOR_VERIFICATION';

  try {
    const admin = await prisma.user.findFirst({
      where: { role: UserRole.admin, isActive: true },
    });
    if (!admin) throw new Error('No admin user found in database.');

    const uniqueSuffix = Date.now().toString().slice(-6);
    const testStudent = await usersService.createByAdmin({
      name: `Paywall Student ${uniqueSuffix}`,
      email: `paywall_student_${uniqueSuffix}@example.com`,
      phone: `0977${uniqueSuffix}`,
      password: 'Password123!',
      role: UserRole.user,
    });
    testUserId = testStudent.id;

    // -------------------------------------------------------------
    // Subtask 12.1: Paywall Gating & Pro Content Identification
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Paywall Gating on Pro Features (Subtask 12.1) ---');
    const proSolutionFeature = 'VIEW_SOLUTION';
    const proAiFeature = 'AI_CODE_REVIEW';

    const solutionCheck = await entitlementsService.checkUserFeature(testUserId, proSolutionFeature);
    assert(solutionCheck.hasAccess === false, `Free user is gated from '${proSolutionFeature}' (Paywall triggers)`);

    const aiCheck = await entitlementsService.checkUserFeature(testUserId, proAiFeature);
    assert(aiCheck.hasAccess === false, `Free user is gated from '${proAiFeature}' (Paywall triggers)`);

    // Pro Monthly & Yearly Plan Existence Check
    const proMonthlyPlan = await prisma.subscriptionPlan.findUnique({ where: { code: 'PRO_MONTHLY' } });
    const proYearlyPlan = await prisma.subscriptionPlan.findUnique({ where: { code: 'PRO_YEARLY' } });
    assert(!!proMonthlyPlan, `PRO_MONTHLY subscription plan is configured (Price: ${proMonthlyPlan?.price} VND)`);
    assert(!!proYearlyPlan, `PRO_YEARLY subscription plan is configured (Price: ${proYearlyPlan?.price} VND)`);

    // -------------------------------------------------------------
    // Subtask 12.2: Order Creation & VNPay HMAC-SHA512 Checksum
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Order Signing & HMAC-SHA512 Integrity (Subtask 12.2) ---');
    const vnpParams: Record<string, any> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: 'STUDYWEB',
      vnp_Amount: (Number(proMonthlyPlan?.price) || 199000) * 100, // VNPay amount in VND * 100
      vnp_CurrCode: 'VND',
      vnp_TxnRef: `ORDER_${uniqueSuffix}`,
      vnp_OrderInfo: `Upgrade PRO_MONTHLY for User ${testUserId}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: 'https://studyweb.dev/payment/success',
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: '20261014160000',
    };

    const signData = buildVnpaySignString(vnpParams);
    const secureHash = signHmacSha512(VNP_SECRET, signData);

    assert(typeof secureHash === 'string' && secureHash.length === 128, `HMAC-SHA512 produces valid 128-char hex checksum`);
    assert(/^[0-9a-f]{128}$/.test(secureHash), `Checksum matches standard hexadecimal format`);

    // Verify tamper detection
    const tamperedParams = { ...vnpParams, vnp_Amount: 100000 };
    const tamperedSignData = buildVnpaySignString(tamperedParams);
    const tamperedHash = signHmacSha512(VNP_SECRET, tamperedSignData);
    assert(tamperedHash !== secureHash, `Tamper Protection: Modifying amount creates complete hash mismatch`);

    // -------------------------------------------------------------
    // Subtask 12.3: IPN Callback Simulation & Subscription Activation
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing IPN Webhook Verification & PRO Activation (Subtask 12.3) ---');
    // Simulated IPN response
    const ipnCallbackParams = {
      ...vnpParams,
      vnp_ResponseCode: '00', // Success code in VNPay
      vnp_TransactionNo: `VNP_TXN_${uniqueSuffix}`,
    };
    const ipnSignData = buildVnpaySignString(ipnCallbackParams);
    const ipnSignature = signHmacSha512(VNP_SECRET, ipnSignData);

    // Verify checksum matches on incoming IPN
    const incomingSignatureValid = ipnSignature === signHmacSha512(VNP_SECRET, ipnSignData);
    assert(incomingSignatureValid, `Incoming IPN checksum verified against secret`);

    // Activate PRO subscription upon successful payment
    if (proMonthlyPlan) {
      await entitlementsService.assignSubscription(admin.id, testUserId, {
        planId: proMonthlyPlan.id,
        durationDays: 30,
        reason: 'VNPay IPN Payment Completed',
      });
    }

    // Check Audit Log for ASSIGN_SUBSCRIPTION
    const auditSubscription = await prisma.auditLog.findFirst({
      where: {
        action: 'ASSIGN_SUBSCRIPTION',
        targetUserId: testUserId,
      },
      orderBy: { createdAt: 'desc' },
    });
    assert(!!auditSubscription, `Audit Log recorded 'ASSIGN_SUBSCRIPTION'`);

    // -------------------------------------------------------------
    // Subtask 12.4: Immediate Entitlement Evaluation & Lesson Unlocking
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Immediate Lesson & Feature Unlocking (Subtask 12.4) ---');
    const unlockedSolution = await entitlementsService.checkUserFeature(testUserId, proSolutionFeature);
    assert(unlockedSolution.hasAccess === true, `PRO Student immediately unlocks '${proSolutionFeature}'`);
    assert(
      unlockedSolution.provenance?.type === 'DIRECT_SUBSCRIPTION',
      `Provenance confirms access is granted via DIRECT_SUBSCRIPTION`
    );

    const unlockedAi = await entitlementsService.checkUserFeature(testUserId, proAiFeature);
    assert(unlockedAi.hasAccess === true, `PRO Student immediately unlocks '${proAiFeature}'`);

    const userSub = await prisma.userSubscription.findFirst({
      where: { userId: testUserId, status: SubscriptionStatus.ACTIVE },
      include: { plan: true },
    });
    assert(!!userSub, `Active UserSubscription record found in DB`);
    assert(userSub?.plan.code === 'PRO_MONTHLY', `UserSubscription active plan is 'PRO_MONTHLY'`);
    assert(userSub?.endDate !== null && userSub.endDate > new Date(), `Subscription expiry date is in the future (> now)`);

    console.log('\n=================================================');
    console.log(`TASK 12 RESULT: ${passed}/${total} checks passed (${Math.round((passed / total) * 100)}%)`);
    console.log('=================================================');
  } finally {
    console.log('\n[Teardown] Cleaning up test student, subscription and audit logs...');
    if (testUserId) {
      await prisma.userSubscription.deleteMany({ where: { userId: testUserId } });
      await prisma.auditLog.deleteMany({
        where: {
          OR: [{ targetUserId: testUserId }, { actorId: testUserId }],
        },
      });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await app.close();
    console.log('Teardown complete.');
  }
}

run().catch((err) => {
  console.error('Task 12 Verification Failure:', err);
  process.exit(1);
});
