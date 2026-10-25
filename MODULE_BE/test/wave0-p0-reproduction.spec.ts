import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { LabsService } from '../src/modules/labs/labs.service';
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

    // Hypothesis 1 verification:
    // auto-syntax-01: passes unchanged (true)
    // auto-syntax-02: passes unchanged (true)
    // auto-syntax-03: fails unchanged (false)
    // auto-syntax-04: passes unchanged (true)
    assert.equal(results['auto-syntax-01-describe-test-structure'], true, 'auto-syntax-01 passes unchanged');
    assert.equal(results['auto-syntax-02-core-matchers-primitive-vs-deep'], true, 'auto-syntax-02 passes unchanged');
    assert.equal(results['auto-syntax-03-api-response-schema-assert'], false, 'auto-syntax-03 fails as intended');
    assert.equal(results['auto-syntax-04-playwright-parameterized-testing'], true, 'auto-syntax-04 passes unchanged');

    const unassistedPassCount = Object.values(results).filter(Boolean).length;
    assert.equal(unassistedPassCount, 3, 'Exactly 3 of 4 legacy labs pass without learner work');
  });

  it('P0-2: Proves legacy js_worker submission retains client-supplied status: passed when objective is plain text', async () => {
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
        }),
        findUnique: async () => ({
          id: 'legacy-js-lab',
          slug: 'auto-syntax-01-describe-test-structure',
          sandboxType: 'js_worker',
          unitType: 'automation_lab',
          objective: 'Tổ chức các kịch bản kiểm thử rõ ràng theo cú pháp BDD với describe và test',
          solution: null,
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
      checkUserFeature: async () => ({ hasAccess: true, isBanned: false }),
    };

    const labsService = new LabsService(mockPrisma, mockEntitlements);

    // Client maliciously/erroneously sends status: 'passed' with empty/forged code
    await labsService.submit('legacy-js-lab', 'user-attacker', {
      submittedCode: '// completely empty or forged code',
      status: 'passed',
      timeMs: 10,
    });

    // Proves the defect: Server trusted client payload because JSON.parse failed silently!
    assert.equal(capturedSubmissionStatus, 'passed', 'Vulnerability demonstrated: server accepted client status: passed');
    assert.equal(capturedProgressStatus, 'COMPLETED', 'Vulnerability demonstrated: client received completed progress without grading');
  });

  it('P0-3: Proves all 8 Automation V3 source configs lack effective gradingRules / gradingKey', () => {
    assert.equal(V3_AUTO_LABS.length, 8);
    for (const lab of V3_AUTO_LABS) {
      assert.ok(lab.config, `Lab ${lab.slug} must have config`);
      const config = lab.config;

      const hasGradingRules = Boolean(Array.isArray(config.gradingRules) && config.gradingRules.length > 0);
      const hasGradingKey = Boolean(config.gradingKey && typeof config.gradingKey === 'object');

      assert.equal(
        hasGradingRules || hasGradingKey,
        false,
        `V3 Lab ${lab.slug} currently lacks server gradingRules or gradingKey`,
      );
    }
  });

  it('P0-4: Proves all 8 Automation V3 starter plans already contain all block types referenced by public checks', () => {
    assert.equal(V3_AUTO_LABS.length, 8);
    for (const lab of V3_AUTO_LABS) {
      const config = lab.config;

      const starterPlan = Array.isArray(config.starterPlan) ? config.starterPlan : [];
      assert.ok(starterPlan.length > 0, `Lab ${lab.slug} has non-empty starter plan`);

      const starterBlockTypes = new Set(starterPlan.map((s: any) => s.blockType));

      const publicChecks = Array.isArray(config.publicChecks) ? config.publicChecks : [];
      // Collect block types from public checks
      const checkedBlockTypes = new Set<string>();
      for (const check of publicChecks) {
        if (check.blockType) checkedBlockTypes.add(check.blockType);
        if (check.type && check.action) {
          const typeActionMap: Record<string, string> = {
            'navigation.goto': 'nav_goto',
            'action.click': 'act_click',
            'action.fill': 'act_fill',
            'action.check': 'act_check',
            'action.selectOption': 'act_select_option',
            'assertion.toBeVisible': 'assert_visible',
            'assertion.toHaveText': 'assert_text',
            'assertion.toHaveValue': 'assert_value',
            'assertion.toHaveCount': 'assert_count',
            'assertion.toHaveURL': 'assert_url',
          };
          const mapped = typeActionMap[`${check.type}.${check.action}`];
          if (mapped) checkedBlockTypes.add(mapped);
        }
      }

      // Proves that every checked block type is already in starterBlockTypes
      for (const reqBlock of checkedBlockTypes) {
        assert.ok(
          starterBlockTypes.has(reqBlock),
          `V3 Lab ${lab.slug} starter plan already contains blockType ${reqBlock}`,
        );
      }
    }
  });

  it('P0-5: Proves older SQL seeded starters contain answer-leaking TODO comments', () => {
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
      assert.match(
        snippet,
        pattern,
        `Legacy lab ${slug} initialSnippet contains the literal answer in TODO comment`,
      );
    }
  });
});
