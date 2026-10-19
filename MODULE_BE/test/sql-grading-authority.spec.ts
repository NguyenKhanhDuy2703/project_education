import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LabsService } from '../src/modules/labs/labs.service';

describe('SQL submission grading authority', () => {
  it('stores the server grade instead of a forged client status', async () => {
    let created: any;
    const lab = {
      id: 'sql-lab-1',
      sandboxType: 'sql_worker',
      solution: 'SELECT id FROM users',
      objective: JSON.stringify({
        version: '2.0',
        schemaSql: 'CREATE TABLE users(id int);',
        expectedQueryResult: [{ id: 1 }],
      }),
      author: {},
      series: {},
    };
    const prisma = {
      lab: { findUnique: async () => lab },
      labSubmission: {
        create: async ({ data }: any) => {
          created = data;
          return { id: 'submission-1', ...data, createdAt: new Date('2026-10-18T00:00:00Z') };
        },
      },
    };
    const grader = {
      grade: async () => ({ status: 'failed', timeMs: 12, testLogs: 'Result mismatch.' }),
    };
    const service = new LabsService(prisma as any, {} as any, grader as any);

    const result = await service.submit('sql-lab-1', 'student-1', {
      submittedCode: 'SELECT 999 AS id',
      status: 'passed',
      timeMs: 1,
      testLogs: 'client says passed',
    });

    assert.equal(result.status, 'failed');
    assert.equal(created.status, 'failed');
    assert.equal(created.executionTimeMs, 12);
    assert.equal(created.testLogs, 'Result mismatch.');
  });
});
