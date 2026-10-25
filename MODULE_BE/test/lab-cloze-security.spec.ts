import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LabsService } from '../src/modules/labs/labs.service';
import { UserRole, ContentLifecycleStatus } from '@prisma/client';

describe('Lab Cloze Security & Config Preservation (Task 4)', () => {
  const mockLabRecord = {
    id: 'lab-cloze-sec-1',
    slug: 'api-cloze-security',
    title: 'Secure Cloze API Exercise',
    objective: JSON.stringify({
      summary: 'Practice 4 API assertion decisions',
      version: '2.0',
      interactionMode: 'smart_cloze',
      framework: 'api',
      publicTemplate: [
        { kind: 'readonly', text: 'expect(res.status).toBe(' },
        { kind: 'blank', blankId: 'status' },
      ],
      blanks: [
        { id: 'status', kind: 'http_status', label: 'HTTP Status', valueType: 'number' },
      ],
      gradingRules: [
        { blankId: 'status', acceptedValues: [200], feedback: 'Status must be 200' },
      ],
      hiddenChecks: [
        { id: 'hidden-1', check: 'assert(res.headers["content-type"])' },
      ],
    }),
    instructions: 'Complete the blanks.',
    initialSnippet: '',
    testScript: 'test("status", () => {});',
    solution: 'Secret Solution Code',
    status: ContentLifecycleStatus.published,
    isProOnly: false,
    authorId: 'author-123',
    series: { id: 'series-1', isProOnly: false },
  };

  const createMockPrisma = (lab: any) => ({
    lab: {
      findFirst: async () => lab,
      findUnique: async () => lab,
    },
  });

  const mockEntitlements = {
    hasFeature: async () => false,
    checkUserFeature: async () => false,
  };

  it('strips gradingRules and hiddenChecks for regular learners (prevents solution leakage)', async () => {
    const service = new LabsService(createMockPrisma(mockLabRecord) as any, mockEntitlements as any);
    const learner = { userId: 'student-999', role: UserRole.user };

    const result = await service.findBySlug('api-cloze-security', learner);

    assert.equal(result.objective, 'Practice 4 API assertion decisions');
    assert.ok(result.config, 'config should be present');
    assert.equal(result.config.interactionMode, 'smart_cloze');
    assert.equal(result.config.blanks.length, 1);
    assert.equal(result.config.gradingRules, undefined, 'gradingRules must be stripped for student');
    assert.equal(result.config.hiddenChecks, undefined, 'hiddenChecks must be stripped for student');
    assert.equal(result.solution, null, 'solution must be hidden for standard student');
  });

  it('preserves gradingRules and hiddenChecks for privileged author or admin', async () => {
    const service = new LabsService(createMockPrisma(mockLabRecord) as any, mockEntitlements as any);
    const author = { userId: 'author-123', role: UserRole.contributor };

    const result = await service.findBySlug('api-cloze-security', author);

    assert.ok(result.config, 'config should be present');
    assert.ok(Array.isArray(result.config.gradingRules), 'gradingRules preserved for author');
    assert.equal(result.config.gradingRules.length, 1);
    assert.equal(result.config.gradingRules[0].acceptedValues[0], 200);
    assert.ok(Array.isArray(result.config.hiddenChecks), 'hiddenChecks preserved for author');
  });

  it('hides SQL expected rows and mutable verification SQL from learners', async () => {
    const sqlLab = {
      ...mockLabRecord,
      sandboxType: 'sql_worker',
      objective: JSON.stringify({
        summary: 'Update one row.',
        schemaSql: 'CREATE TABLE users(id int, active boolean);',
        seedSql: 'INSERT INTO users VALUES (1, false);',
        expectedQueryResult: [{ id: 1, active: true }],
        verificationSql: 'SELECT * FROM users ORDER BY id',
        statementPolicy: 'mutable',
      }),
    };
    const service = new LabsService(createMockPrisma(sqlLab) as any, mockEntitlements as any);

    const result = await service.findBySlug('sql-hidden-grade', {
      userId: 'student-999',
      role: UserRole.user,
    });

    assert.equal(result.expectedQueryResult, undefined);
    assert.equal(result.config.expectedQueryResult, undefined);
    assert.equal(result.config.verificationSql, undefined);
    assert.equal(result.config.schemaSql.includes('CREATE TABLE'), true);
    assert.equal(result.config.seedSql.includes('INSERT INTO'), true);
  });

  it('strips V3 gradingKey and solutionPlan for regular learners while preserving public fixture and blocks', async () => {
    const v3LabRecord = {
      ...mockLabRecord,
      id: 'lab-v3-sec-1',
      slug: 'playwright-v3-login',
      objective: JSON.stringify({
        version: '3.0',
        framework: 'playwright',
        interactionMode: 'block_builder',
        contentRevision: 'v3.0.1',
        fixture: {
          fixtureId: 'login-fixture',
          fixtureVersion: '1.0.0',
          initialRoute: '/auth/login',
        },
        allowedBlocks: [
          { id: 'b1', category: 'action', name: 'click', label: 'click' },
        ],
        starterPlan: [
          { stepId: 's1', type: 'navigation', action: 'goto', targetUrl: '/auth/login' },
        ],
        publicChecks: [
          { id: 'c1', name: 'Check Navigation' },
        ],
        gradingKey: {
          exerciseRevision: 'v3.0.1',
          requiredSteps: [{ type: 'action', action: 'click' }],
          minScore: 100,
        },
        solutionPlan: [{ type: 'action', action: 'click' }],
      }),
    };

    const service = new LabsService(createMockPrisma(v3LabRecord) as any, mockEntitlements as any);
    const learner = { userId: 'student-999', role: UserRole.user };
    const result = await service.findBySlug('playwright-v3-login', learner);

    assert.ok(result.config, 'config should be present');
    assert.equal(result.config.version, '3.0');
    assert.equal(result.config.framework, 'playwright');
    assert.equal(result.config.gradingKey, undefined, 'gradingKey must be stripped for learner');
    assert.equal(result.config.solutionPlan, undefined, 'solutionPlan must be stripped for learner');
    assert.ok(result.config.fixture, 'fixture must be preserved');
    assert.equal(result.config.fixture.initialRoute, '/auth/login');
    assert.equal(result.config.allowedBlocks.length, 1);
    assert.equal(result.config.starterPlan.length, 1);
  });

  it('preserves V3 gradingKey for admin or author', async () => {
    const v3LabRecord = {
      ...mockLabRecord,
      id: 'lab-v3-sec-1',
      slug: 'playwright-v3-login',
      objective: JSON.stringify({
        version: '3.0',
        framework: 'playwright',
        interactionMode: 'block_builder',
        contentRevision: 'v3.0.1',
        fixture: {
          fixtureId: 'login-fixture',
          fixtureVersion: '1.0.0',
          initialRoute: '/auth/login',
        },
        allowedBlocks: [],
        starterPlan: [],
        publicChecks: [],
        gradingKey: {
          exerciseRevision: 'v3.0.1',
          requiredSteps: [{ type: 'action', action: 'click' }],
          minScore: 100,
        },
      }),
    };

    const service = new LabsService(createMockPrisma(v3LabRecord) as any, mockEntitlements as any);
    const admin = { userId: 'admin-001', role: UserRole.admin };
    const result = await service.findBySlug('playwright-v3-login', admin);

    assert.ok(result.config, 'config should be present');
    assert.ok(result.config.gradingKey, 'gradingKey must be preserved for admin');
    assert.equal(result.config.gradingKey.exerciseRevision, 'v3.0.1');
    assert.equal(result.config.gradingKey.minScore, 100);
  });
});
