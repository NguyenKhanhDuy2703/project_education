import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { LabsService } from '../src/modules/labs/labs.service';
import { validateV3AutomationSubmission } from '../src/modules/labs/automation-v3-validator';
import { UserRole } from '@prisma/client';
import {
  V3_AUTO_LABS,
} from '../prisma/v3-curriculum-data';

describe('Wave 0 P0 Vulnerability Reproduction Suite', () => {
  it('P0-1: Proves 3 of 4 legacy auto-syntax labs pass unchanged with their starter code', () => {
    const seedPath = path.resolve(__dirname, '../prisma/seed.ts');
    const seedContent = fs.readFileSync(seedPath, 'utf-8');

    // Extract auto-syntax labs from seed.ts
    const legacyLabSlugs = [
      'auto-syntax-01-describe-test-structure',
      'auto-syntax-02-core-matchers-primitive-vs-deep',
      'auto-syntax-03-api-response-schema-assert',
      'auto-syntax-04-playwright-parameterized-testing',
    ];

    const results: Record<string, boolean> = {};

    for (const slug of legacyLabSlugs) {
      const slugIndex = seedContent.indexOf(`slug: '${slug}'`);
      assert.ok(slugIndex !== -1, `Slug ${slug} must be found in seed.ts`);
      const block = seedContent.slice(slugIndex, slugIndex + 2500);

      // Extract initialSnippet
      const snippetMatch = block.match(/initialSnippet:\s*`([\s\S]*?)`,/);
      // Extract testScript
      const testMatch = block.match(/testScript:\s*`([\s\S]*?)`,/);

      assert.ok(snippetMatch, `initialSnippet for ${slug} should exist`);
      assert.ok(testMatch, `testScript for ${slug} should exist`);

      // Unescape template literals (e.g. \${role} -> ${role}, \` -> `) as runtime seed does
      let snippet = snippetMatch[1].replace(/\\\$/g, '$').replace(/\\`/g, '`');
      let testScript = testMatch[1].replace(/\\\$/g, '$').replace(/\\`/g, '`');

      // Run snippet + testScript in isolated sandbox function
      let passed = false;
      try {
        const assertFn = (name: string, condition: boolean) => {
          if (!condition) throw new Error(`Assertion failed: ${name}`);
        };
        const runCode = new Function('assert', `${snippet}\n${testScript}`);
        runCode(assertFn);
        passed = true;
      } catch (e) {
        passed = false;
      }

      results[slug] = passed;
    }

    // Prevention verification:
    // None of the 4 legacy labs pass without learner work
    assert.equal(results['auto-syntax-01-describe-test-structure'], false, 'auto-syntax-01 fails as intended with incomplete starter');
    assert.equal(results['auto-syntax-02-core-matchers-primitive-vs-deep'], false, 'auto-syntax-02 fails as intended with incomplete starter');
    assert.equal(results['auto-syntax-03-api-response-schema-assert'], false, 'auto-syntax-03 fails as intended');
    assert.equal(results['auto-syntax-04-playwright-parameterized-testing'], false, 'auto-syntax-04 fails as intended with incomplete starter');

    const unassistedPassCount = Object.values(results).filter(Boolean).length;
    assert.equal(unassistedPassCount, 0, 'Zero legacy labs pass without learner work');
  });

  it('P0-2: Proves legacy js_worker submission rejects client-supplied status: passed when objective is plain text', async () => {
    let capturedSubmissionStatus: string | null = null;
    let capturedProgressStatus: string | null = null;

    const mockPrisma: any = {
      lab: {
        findFirst: async () => ({
          id: 'legacy-js-lab',
          slug: 'auto-syntax-01-describe-test-structure',
          sandboxType: 'js_worker',
          unitType: 'automation_lab',
          objective: 'Tổ chức các kịch bản kiểm thử rõ ràng theo cú pháp BDD với describe và test', // Plain text, NOT JSON
          solution: null,
          status: 'published',
          series: { isProOnly: false },
        }),
        findUnique: async () => ({
          id: 'legacy-js-lab',
          slug: 'auto-syntax-01-describe-test-structure',
          sandboxType: 'js_worker',
          unitType: 'automation_lab',
          objective: 'Tổ chức các kịch bản kiểm thử rõ ràng theo cú pháp BDD với describe và test',
          solution: null,
          status: 'published',
          series: { isProOnly: false },
        }),
      },
      labSubmission: {
        create: async ({ data }: any) => {
          capturedSubmissionStatus = data.status;
          return { id: 'sub-legacy-1', createdAt: new Date(), ...data };
        },
      },
      learningUnitProgress: {
        findUnique: async () => null,
        upsert: async ({ create }: any) => {
          capturedProgressStatus = create.status;
          return { id: 'prog-1', createdAt: new Date(), ...create };
        },
      },
    };

    const mockEntitlements: any = {
      checkUserFeature: async () => ({ hasAccess: false, isBanned: false }),
    };

    const labsService = new LabsService(mockPrisma, mockEntitlements);

    // Client maliciously/erroneously sends status: 'passed' with empty/forged code
    await labsService.submit('legacy-js-lab', 'user-attacker', {
      submittedCode: '// completely empty or forged code',
      status: 'passed',
      timeMs: 10,
    });

    // Prevention verified: Server strictly defaulted to failed status!
    assert.equal(capturedSubmissionStatus, 'failed', 'Server grading strictly enforces failed status for invalid/empty submission');
    assert.notEqual(capturedProgressStatus, 'COMPLETED', 'Client cannot attain COMPLETED progress without server-verified pass');
  });

  it('P0-3: Proves all 8 Automation V3 source configs have effective gradingRules or gradingKey', () => {
    assert.equal(V3_AUTO_LABS.length, 8);
    for (const lab of V3_AUTO_LABS) {
      assert.ok(lab.config, `Lab ${lab.slug} must have config`);
      const config = lab.config as Record<string, unknown>;

      const hasGradingRules = Boolean(Array.isArray(config.gradingRules) && config.gradingRules.length > 0);
      const hasGradingKey = Boolean(config.gradingKey && typeof config.gradingKey === 'object');

      assert.equal(
        hasGradingRules || hasGradingKey,
        true,
        `V3 Lab ${lab.slug} must have server gradingRules or gradingKey`,
      );
    }
  });

  it('P0-4: Proves all 8 Automation V3 starter plans do not contain all block types referenced by public checks', () => {
    assert.equal(V3_AUTO_LABS.length, 8);
    for (const lab of V3_AUTO_LABS) {
      const config = lab.config;

      const starterPlan = Array.isArray(config.starterPlan) ? config.starterPlan : [];
      assert.ok(starterPlan.length > 0, `Lab ${lab.slug} has non-empty starter plan`);

      const starterBlockTypes = new Set(starterPlan.map((s: any) => s.blockType));

      const publicChecks = Array.isArray(config.publicChecks) ? config.publicChecks : [];
      const checkedBlockTypes = new Set(
        publicChecks.map((check) => check.targetBlockType),
      );

      // Verifies that at least one required block type is missing from starterBlockTypes
      let allAlreadyPresent = true;
      for (const reqBlock of checkedBlockTypes) {
        if (!starterBlockTypes.has(reqBlock)) {
          allAlreadyPresent = false;
          break;
        }
      }
      assert.equal(
        allAlreadyPresent,
        false,
        `V3 Lab ${lab.slug} starter plan must not already contain all target blocks`,
      );
    }
  });

  it('P0-5: Proves older SQL seeded starters do not contain answer-leaking TODO comments', () => {
    const seedPath = path.resolve(__dirname, '../prisma/seed.ts');
    const seedContent = fs.readFileSync(seedPath, 'utf-8');

    // W3Schools SQL labs
    const answerLeakingPatterns = [
      { slug: 'w3schools-sql-03-select-distinct', pattern: /DISTINCT/i },
      { slug: 'w3schools-sql-04-where', pattern: /Country\s*=\s*'Mexico'/i },
      { slug: 'w3schools-sql-05-order-by', pattern: /Price\s+DESC/i },
      { slug: 'w3schools-sql-06-and-or', pattern: /City\s*=\s*'Berlin'/i },
    ];

    for (const { slug, pattern } of answerLeakingPatterns) {
      const slugIndex = seedContent.indexOf(`slug: '${slug}'`);
      assert.ok(slugIndex !== -1, `Slug ${slug} must exist in seed.ts`);
      const block = seedContent.slice(slugIndex, slugIndex + 1200);

      const snippetMatch = block.match(/initialSnippet:\s*`([\s\S]*?)`,/);
      assert.ok(snippetMatch, `initialSnippet for ${slug} must exist`);

      const snippet = snippetMatch[1];
      assert.equal(
        pattern.test(snippet),
        false,
        `Legacy lab ${slug} initialSnippet must not contain the literal answer in TODO comment`,
      );
    }
  });
  it('P0-6: Proves unmodified starter plans fail server validation for all 8 Playwright labs', () => {
    for (const lab of V3_AUTO_LABS) {
      const config = lab.config as any;
      const starterPlan = Array.isArray(config?.starterPlan) ? config.starterPlan : [];

      const rawPayload = {
        version: config?.version || '3.0',
        exerciseRevision: config?.contentRevision || 'v3.0.0',
        stepPlan: starterPlan,
        generatedCode: '// Starter code only',
        status: 'passed',
        timeMs: 50,
      };

      const encoded = `/* AUTOMATION_V3_SUBMISSION:${Buffer.from(JSON.stringify(rawPayload)).toString('base64')}*/\n\n${rawPayload.generatedCode}`;

      const validation = validateV3AutomationSubmission(encoded, config);
      assert.equal(
        validation.status,
        'failed',
        `Starter plan for ${lab.slug} must not be sufficient to pass grading rules (Expected fail, got valid)`
      );
    }
  });

  it('P0-7: Proves solutions, gradingRules, and gradingKey are strictly stripped for ordinary learners', async () => {
    const prevFlag = process.env.FEATURE_AUTOMATION_CONTENT_ENABLED;
    process.env.FEATURE_AUTOMATION_CONTENT_ENABLED = 'true';

    try {
      const testLab = V3_AUTO_LABS[0];
      const mockPrisma: any = {
        lab: {
          findFirst: async () => ({
            ...testLab,
            objective: JSON.stringify({ summary: testLab.title, ...testLab.config }),
            status: 'published',
            authorId: 'author-999',
            series: { isProOnly: false },
          }),
        },
        learningUnitProgress: {
          findUnique: async () => null,
        },
      };

      const mockEntitlements: any = {
        checkUserFeature: async () => ({ hasAccess: false, isBanned: false }),
      };

      const service = new LabsService(mockPrisma, mockEntitlements);
      const res = await service.findBySlug(testLab.slug, { userId: 'learner-1', role: UserRole.user });

      assert.equal(res.solution, null, 'Solution must be stripped for non-completed learner');
      assert.equal(res.config?.gradingRules, undefined, 'gradingRules must be stripped from config');
      assert.equal(res.config?.gradingKey, undefined, 'gradingKey must be stripped from config');
      assert.equal(res.config?.hiddenChecks, undefined, 'hiddenChecks must be stripped from config');
      assert.ok(res.config?.allowedBlocks, 'allowedBlocks must remain visible');
    } finally {
      process.env.FEATURE_AUTOMATION_CONTENT_ENABLED = prevFlag;
    }
  });
});