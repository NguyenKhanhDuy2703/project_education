import { describe, it, expect } from 'vitest';
import type {
  AutomationExerciseV2,
  BlankDefinition,
  TemplateSegment,
  SqlLabConfig,
  QuizLabConfig,
  QuizQuestionV1,
  LabContentEnvelopeV1,
  LabDetail,
} from '@/types/lab.types';
import type { ReviewQueueItem } from '@/features/admin/api/review.admin.api';

describe('Admin Lab Types & V2 Envelope Contract Suite', () => {
  describe('V2 Smart Cloze Contracts', () => {
    it('constructs a valid BlankDefinition with validation rules and typing', () => {
      const blank: BlankDefinition = {
        id: 'blank-1',
        kind: 'text',
        label: 'HTTP Status Equality',
        required: true,
        valueType: 'string',
        placeholder: 'status === 200',
        defaultValue: '',
        validation: [
          {
            type: 'regex',
            value: '^status\\s*===?\\s*200$',
            message: 'Status code must be equal to 200',
          },
          {
            type: 'required',
            message: 'Field cannot be empty',
          },
        ],
        helperText: 'Check HTTP status code equality',
        conceptTags: ['http', 'status_codes'],
      };

      expect(blank.id).toBe('blank-1');
      expect(blank.kind).toBe('text');
      expect(blank.valueType).toBe('string');
      expect(blank.validation).toHaveLength(2);

      const regexRule = blank.validation?.find((v) => v.type === 'regex');
      expect(regexRule).toBeDefined();
      const regex = new RegExp(regexRule!.value);
      expect(regex.test('status === 200')).toBe(true);
      expect(regex.test('status == 200')).toBe(true);
      expect(regex.test('status !== 200')).toBe(false);
    });

    it('constructs template segments for smart cloze reconstruction', () => {
      const segments: TemplateSegment[] = [
        { kind: 'readonly', text: 'function checkResponse(status) {\n  return ' },
        { kind: 'blank', blankId: 'blank-1' },
        { kind: 'readonly', text: ';\n}' },
      ];

      expect(segments).toHaveLength(3);
      expect(segments[0].kind).toBe('readonly');
      expect(segments[1].kind).toBe('blank');
      if (segments[1].kind === 'blank') {
        expect(segments[1].blankId).toBe('blank-1');
      }

      const reconstructed = segments
        .map((s) => (s.kind === 'readonly' ? s.text : s.kind === 'blank' ? `{{${s.blankId}}}` : s.code || ''))
        .join('');
      expect(reconstructed).toBe('function checkResponse(status) {\n  return {{blank-1}};\n}');
    });

    it('validates AutomationExerciseV2 schema with smart cloze and public checks', () => {
      const v2Exercise: AutomationExerciseV2 = {
        version: '2.0',
        interactionMode: 'smart_cloze',
        framework: 'playwright',
        targetFunction: 'validateSession',
        blanks: [
          {
            id: 'b1',
            kind: 'text',
            label: 'Header Token Extraction',
            valueType: 'string',
            required: true,
          },
        ],
        publicTemplate: [
          { kind: 'readonly', text: 'export function validateSession(req: any) {\n  const token = ' },
          { kind: 'blank', blankId: 'b1' },
          { kind: 'readonly', text: ';\n  return Boolean(token);\n}' },
        ],
        publicChecks: [
          {
            id: 'chk-1',
            name: 'Authorization Header Check',
            description: 'Extracts authorization Bearer token from incoming request',
            blankId: 'b1',
            conceptTag: 'auth',
          },
        ],
        gradingRules: [
          {
            blankId: 'b1',
            acceptedValues: ["req.headers['authorization']", 'req.headers.authorization'],
            pattern: "^req\\.headers(\\.authorization|\\['authorization'\\])$",
          },
        ],
      };

      expect(v2Exercise.version).toBe('2.0');
      expect(v2Exercise.interactionMode).toBe('smart_cloze');
      expect(v2Exercise.framework).toBe('playwright');
      expect(v2Exercise.blanks).toHaveLength(1);
      expect(v2Exercise.publicTemplate).toHaveLength(3);
      expect(v2Exercise.publicChecks).toHaveLength(1);
      expect(v2Exercise.gradingRules).toHaveLength(1);
    });
  });

  describe('SQL Sandbox Contract', () => {
    it('constructs a valid SqlLabConfig structure', () => {
      const sqlConfig: SqlLabConfig = {
        version: '1.0',
        schemaSql: 'CREATE TABLE audit_logs (id SERIAL PRIMARY KEY, action VARCHAR(50));',
        seedSql: "INSERT INTO audit_logs (action) VALUES ('LOGIN'), ('UPDATE_ROLE');",
        expectedQueryResult: [{ id: 1, action: 'LOGIN' }],
        expectedColumns: ['id', 'action'],
        orderSensitive: false,
        sampleRowsVisible: true,
      };

      expect(sqlConfig.version).toBe('1.0');
      expect(sqlConfig.schemaSql).toContain('CREATE TABLE');
      expect(sqlConfig.seedSql).toContain('INSERT INTO');
      expect(sqlConfig.expectedColumns).toEqual(['id', 'action']);
      expect(sqlConfig.expectedQueryResult).toHaveLength(1);
    });
  });

  describe('Quizlet Contract', () => {
    it('constructs a valid QuizLabConfig with questions', () => {
      const questions: QuizQuestionV1[] = [
        {
          id: 'q1',
          question: 'Which HTTP method is idempotent according to RFC 9110?',
          options: ['POST', 'PUT', 'CONNECT', 'PATCH'],
          correctIndex: 1, // 'PUT'
          explanation: 'PUT is defined as idempotent since multiple identical requests produce the same state.',
          hint: 'Consider whether calling it multiple times creates multiple resources',
        },
        {
          id: 'q2',
          question: 'Indexes always speed up database write operations.',
          options: ['True', 'False'],
          correctIndex: 1, // 'False'
          explanation: 'Indexes introduce write amplification overhead during INSERT/UPDATE/DELETE.',
        },
      ];

      const quizConfig: QuizLabConfig = {
        version: '1.0',
        questions,
        passPercentage: 80,
        allowReviewBeforeSubmit: true,
      };

      expect(quizConfig.version).toBe('1.0');
      expect(quizConfig.passPercentage).toBe(80);
      expect(quizConfig.allowReviewBeforeSubmit).toBe(true);
      expect(quizConfig.questions).toHaveLength(2);
      expect(quizConfig.questions[0].correctIndex).toBe(1);
    });
  });

  describe('Envelope Discrimination & Review Queue Integration', () => {
    it('discriminates envelope sandboxType properly', () => {
      const inspectEnvelope = (env: LabContentEnvelopeV1): string => {
        switch (env.sandboxType) {
          case 'js_worker': {
            const cfg = env.config as AutomationExerciseV2 | undefined;
            return `code:blanks=${cfg?.blanks?.length || 0}`;
          }
          case 'sql_worker': {
            return `sql:schema=${Boolean(env.config.schemaSql)}`;
          }
          case 'quizlet': {
            return `quiz:count=${env.config.questions.length}`;
          }
          default: {
            const _exhaustive: never = env;
            return _exhaustive;
          }
        }
      };

      const clozeEnv: LabContentEnvelopeV1 = {
        version: '2.0',
        sandboxType: 'js_worker',
        instructions: '# Test Cloze',
        initialSnippet: 'const x = {{b1}};',
        testScript: 'expect(x).toBe(10);',
        config: {
          version: '2.0',
          interactionMode: 'smart_cloze',
          publicTemplate: [{ kind: 'blank', blankId: 'b1' }],
          blanks: [{ id: 'b1', kind: 'text', label: 'Val', valueType: 'number' }],
        },
      };

      const sqlEnv: LabContentEnvelopeV1 = {
        version: '1.0',
        sandboxType: 'sql_worker',
        instructions: '# SQL Query',
        initialSnippet: 'SELECT * FROM t;',
        config: {
          version: '1.0',
          schemaSql: 'CREATE TABLE t (x INT);',
        },
      };

      expect(inspectEnvelope(clozeEnv)).toBe('code:blanks=1');
      expect(inspectEnvelope(sqlEnv)).toBe('sql:schema=true');
    });

    it('supports ReviewQueueItem with optional V2 envelope', () => {
      const reviewItem: ReviewQueueItem = {
        id: 'submission-101',
        title: 'Database Sharding Fundamentals',
        type: 'lab',
        status: 'submitted',
        submittedAt: '2026-10-18T12:00:00Z',
        authorId: 'user-1',
        authorName: 'Jane Contributor',
        envelope: {
          version: '2.0',
          sandboxType: 'js_worker',
          instructions: 'Fill the connection string',
          initialSnippet: 'const port = {{b1}};',
          testScript: 'test();',
          config: {
            version: '2.0',
            interactionMode: 'smart_cloze',
            blanks: [{ id: 'b1', kind: 'text', label: 'Port', valueType: 'number' }],
            publicTemplate: [{ kind: 'blank', blankId: 'b1' }],
          },
        },
      };

      expect(reviewItem.envelope).toBeDefined();
      expect(reviewItem.envelope?.sandboxType).toBe('js_worker');
      const cfg = reviewItem.envelope?.config as AutomationExerciseV2;
      expect(cfg.interactionMode).toBe('smart_cloze');
      expect(cfg.blanks?.[0].label).toBe('Port');
    });

    it('preserves backwards compatibility on LabDetail with envelope field', () => {
      const lab: LabDetail = {
        id: 'lab-1',
        seriesId: 'topic-1',
        title: 'Legacy or V2 Lab',
        slug: 'legacy-or-v2-lab',
        order: 1,
        isProOnly: false,
        sandboxType: 'js_worker',
        instructions: 'Do the task',
        initialSnippet: 'return null;',
        testScript: 'test();',
        envelope: {
          version: '2.0',
          sandboxType: 'js_worker',
          instructions: 'Do the task',
          initialSnippet: 'return null;',
          testScript: 'test();',
          config: {
            version: '2.0',
            interactionMode: 'smart_cloze',
            blanks: [],
            publicTemplate: [],
          },
        },
      };

      expect(lab.sandboxType).toBe('js_worker');
      expect(lab.envelope?.version).toBe('2.0');
    });
  });
});
