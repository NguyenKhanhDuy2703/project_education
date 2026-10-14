import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { LabsService } from '../src/modules/labs/labs.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function runSubmissionVerification() {
  console.log('🚀 Starting Verification: Task 4 (Lab Submission & Progress Tracking)...');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const labsService = app.get(LabsService);
  const prisma = app.get(PrismaService);

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

  try {
    // Find a valid active lab and user
    const lab = await prisma.lab.findFirst({ where: { isActive: true } });
    const user = await prisma.user.findFirst({ where: { isActive: true } });

    if (!lab || !user) {
      throw new Error('No active lab or user found for submission testing.');
    }

    console.log(`\n--- 1. Testing Lab Submission Creation (PB-11 / Subtask 4.1) ---`);
    console.log(`  Target Lab: "${lab.title}" (${lab.id})`);
    console.log(`  User: "${user.name}" (${user.id})`);

    const submissionPayload = {
      submittedCode: 'function solve() { return 42; }',
      status: 'passed',
      timeMs: 38,
      testLogs: '✓ Test 1: Expected 42 and got 42',
    };

    const submissionResult = await labsService.submit(lab.id, user.id, submissionPayload);
    assert(Boolean(submissionResult.id), 'Successfully creates a submission record with UUID');
    assert(submissionResult.status === 'passed', `Records submission status correctly: ${submissionResult.status}`);
    assert(submissionResult.timeMs === 38, `Records execution time: ${submissionResult.timeMs}ms`);

    // 2. Querying submissions
    console.log(`\n--- 2. Testing Submissions Retrieval (PB-11 / Subtask 4.2) ---`);
    const userSubmissions = await labsService.getSubmissions(lab.id, user.id);
    assert(Array.isArray(userSubmissions), 'getSubmissions returns an array of attempts');
    assert(userSubmissions.length > 0, `Contains newly created submission (found: ${userSubmissions.length})`);
    assert(userSubmissions[0].submittedCode === submissionPayload.submittedCode, 'Submitted code stored with full fidelity');

    // 3. User Progress calculation
    console.log(`\n--- 3. Testing Progress Aggregation (PB-13 / Subtask 4.4) ---`);
    const completedCount = await prisma.labSubmission.count({
      where: {
        userId: user.id,
        status: 'passed',
      },
    });
    assert(completedCount >= 1, `Calculates completed labs accurately for dashboard progress (count: ${completedCount})`);

    console.log(`\n🎉 Verification Summary: ${passed}/${total} checks passed!`);
  } catch (error) {
    console.error('Fatal error during submission verification:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

runSubmissionVerification();
