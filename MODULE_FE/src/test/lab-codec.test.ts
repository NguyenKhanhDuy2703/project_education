import { describe, it, expect } from 'vitest';
import { normalizeLabDetail, serializeEnvelope } from '@/features/lab/domain/labContentCodec';
import type { LabContentEnvelopeV1 } from '@/types/lab.types';

describe('LabContentCodec Suite (Subtask 2.2)', () => {
  it('normalizes legacy SQL lab data correctly', () => {
    const legacyRaw = {
      id: 'lab-sql-1',
      title: 'SQL Select Basics',
      sandboxType: 'sql_worker',
      instructions: '# Instructions',
      initialSnippet: 'SELECT *',
      sqlSchema: 'CREATE TABLE orders (id int);',
      sampleData: [{ id: 1, amount: 100 }],
      expectedQueryResult: [{ id: 1, amount: 100 }],
    };

    const normalized = normalizeLabDetail(legacyRaw);
    expect(normalized.sandboxType).toBe('sql_worker');
    expect(normalized.envelope.sandboxType).toBe('sql_worker');
    if (normalized.envelope.sandboxType === 'sql_worker') {
      expect(normalized.envelope.config.schemaSql).toBe('CREATE TABLE orders (id int);');
      expect(normalized.envelope.config.expectedQueryResult).toEqual([{ id: 1, amount: 100 }]);
    }
  });

  it('normalizes legacy Quizlet lab data correctly', () => {
    const legacyQuiz = {
      id: 'lab-quiz-1',
      title: 'Testing Quiz',
      sandboxType: 'quizlet',
      instructions: '# Quiz Instructions',
      quizQuestions: [
        {
          id: 'q1',
          question: 'What is Jest?',
          options: ['Test runner', 'Browser'],
          correctIndex: 0,
        },
      ],
    };

    const normalized = normalizeLabDetail(legacyQuiz);
    expect(normalized.sandboxType).toBe('quizlet');
    if (normalized.envelope.sandboxType === 'quizlet') {
      expect(normalized.envelope.config.questions.length).toBe(1);
      expect(normalized.envelope.config.questions[0].question).toBe('What is Jest?');
    }
  });

  it('supports round-trip serialize -> normalize with 100% fidelity', () => {
    const originalEnvelope: LabContentEnvelopeV1 = {
      version: '1.0',
      sandboxType: 'sql_worker',
      instructions: '# Advanced SQL',
      initialSnippet: 'SELECT name FROM employees;',
      config: {
        version: '1.0',
        schemaSql: 'CREATE TABLE employees (id int, name text);',
        orderSensitive: true,
      },
    };

    const serialized = serializeEnvelope(originalEnvelope);
    const restored = normalizeLabDetail({
      id: 'round-trip-test',
      sandboxType: 'sql_worker',
      ...serialized,
    });

    expect(restored.envelope.sandboxType).toBe('sql_worker');
    if (restored.envelope.sandboxType === 'sql_worker') {
      expect(restored.envelope.config.schemaSql).toBe('CREATE TABLE employees (id int, name text);');
      expect(restored.envelope.config.orderSensitive).toBe(true);
    }
  });

  it('normalizes Automation V2 Smart Cloze lab data correctly', () => {
    const v2Raw = {
      id: 'lab-auto-cloze-1',
      title: 'Auth Login Status Verification',
      sandboxType: 'js_worker',
      instructions: '# Test the login endpoint status',
      objective: JSON.stringify({
        _envelopeVersion: '2.0',
        interactionMode: 'smart_cloze',
        framework: 'api',
        publicTemplate: [
          { kind: 'managed', label: 'Test setup' },
          { kind: 'readonly', text: 'expect(res.status).toBe(' },
          { kind: 'blank', blankId: 'status_code' },
          { kind: 'readonly', text: ');' },
        ],
        blanks: [
          {
            id: 'status_code',
            kind: 'http_status',
            label: 'Expected HTTP Status',
            valueType: 'number',
            defaultValue: 200,
            options: [{ value: 200, label: '200 OK' }, { value: 401, label: '401 Unauthorized' }],
          },
        ],
      }),
    };

    const normalized = normalizeLabDetail(v2Raw as any);
    expect(normalized.envelope.version).toBe('2.0');
    expect(normalized.envelope.sandboxType).toBe('js_worker');
    const config = normalized.envelope.config as any;
    expect(config.interactionMode).toBe('smart_cloze');
    expect(config.blanks.length).toBe(1);
    expect(config.blanks[0].id).toBe('status_code');
    expect(config.publicTemplate.length).toBe(4);
  });

  it('supports round-trip for Automation V2 Smart Cloze envelope', () => {
    const v2Envelope: LabContentEnvelopeV1 = {
      version: '2.0',
      sandboxType: 'js_worker',
      instructions: '# Instructions V2',
      initialSnippet: '',
      testScript: 'test("check", () => {});',
      config: {
        version: '2.0',
        interactionMode: 'smart_cloze',
        publicTemplate: [{ kind: 'blank', blankId: 'b1' }],
        blanks: [{ id: 'b1', kind: 'http_status', label: 'Status', valueType: 'number' }],
      } as any,
    };

    const serialized = serializeEnvelope(v2Envelope);
    const restored = normalizeLabDetail({
      id: 'v2-roundtrip',
      sandboxType: 'js_worker',
      ...serialized,
    });

    expect(restored.envelope.version).toBe('2.0');
    const config = restored.envelope.config as any;
    expect(config.interactionMode).toBe('smart_cloze');
    expect(config.blanks[0].id).toBe('b1');
  });

  it('correctly parses raw.config object even when raw.objective is a plain text summary', () => {
    const labWithTextSummary = {
      id: 'v2-summary',
      sandboxType: 'js_worker',
      objective: 'Practice HTTP status verification and assertion decisions',
      config: {
        version: '2.0',
        interactionMode: 'smart_cloze',
        framework: 'api',
        publicTemplate: [{ kind: 'blank', blankId: 'code_status' }],
        blanks: [{ id: 'code_status', kind: 'http_status', label: 'Status', valueType: 'number' }],
      },
    };

    const normalized = normalizeLabDetail(labWithTextSummary as any);
    expect(normalized.envelope.version).toBe('2.0');
    const config = normalized.envelope.config as any;
    expect(config.interactionMode).toBe('smart_cloze');
    expect(config.blanks).toHaveLength(1);
    expect(config.blanks[0].id).toBe('code_status');
  });

  it('self-heals SQL lab by synthesizing schema and seed when schemaSql is missing but sampleData exists', () => {
    const legacyMissingSchema = {
      id: 'sql-legacy-missing',
      sandboxType: 'sql_worker',
      instructions: 'Query all customers from Customers table: SELECT * FROM Customers',
      initialSnippet: 'SELECT * FROM Customers;',
      sampleData: [
        { CustomerID: 1, CustomerName: 'Alfreds Futterkiste', Country: 'Germany' },
        { CustomerID: 2, CustomerName: 'Ana Trujillo', Country: 'Mexico' },
      ],
    };

    const normalized = normalizeLabDetail(legacyMissingSchema as any);
    expect(normalized.sandboxType).toBe('sql_worker');
    if (normalized.envelope.sandboxType === 'sql_worker') {
      const sqlConfig = normalized.envelope.config;
      expect(sqlConfig.schemaSql).toContain('CREATE TABLE IF NOT EXISTS Customers');
      expect(sqlConfig.schemaSql).toContain('CustomerID INTEGER PRIMARY KEY');
      expect(sqlConfig.schemaSql).toContain('CustomerName TEXT');
      expect(sqlConfig.schemaSql).toContain('INSERT INTO Customers');
      expect(sqlConfig.schemaSql).toContain('Alfreds Futterkiste');
    }
  });
});

