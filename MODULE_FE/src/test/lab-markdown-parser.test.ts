import { describe, it, expect } from 'vitest';
import {
  parseLabMarkdown,
  serializeLabMarkdown,
} from '../features/lab/utils/lab-markdown-parser';
import type { LabContentEnvelopeV1 } from '../types/lab.types';

describe('Lab Markdown Parser & Serializer Suite (Subtask 7.2)', () => {
  it('parses JS automation lab with starter, tests, and solution', () => {
    const md = `
# Calculate Total
Write a function that calculates cart total.

:::starter javascript
function calculateTotal(items) {
  return 0;
}
:::

:::tests javascript
test('calculates sum', () => {
  expect(calculateTotal([{ price: 10 }])).toBe(10);
});
:::

:::solution javascript
function calculateTotal(items) {
  return items.reduce((s, i) => s + i.price, 0);
}
:::
    `;

    const { envelope, diagnostics } = parseLabMarkdown(md, 'js_worker');
    expect(diagnostics).toHaveLength(0);
    expect(envelope.sandboxType).toBe('js_worker');
    expect(envelope.instructions).toContain('# Calculate Total');
    expect(envelope.initialSnippet).toContain('function calculateTotal(items)');
    expect(envelope.testScript).toContain("test('calculates sum'");
    expect(envelope.solution).toContain('items.reduce');
  });

  it('parses SQL lab with schema, seed, expected result, and starter', () => {
    const md = `
# SQL Query Practice
Find all active users.

:::schema
CREATE TABLE users (id int, name text, active boolean);
:::

:::seed
INSERT INTO users VALUES (1, 'Alice', true), (2, 'Bob', false);
:::

:::starter sql
SELECT * FROM users WHERE active = true;
:::

:::expected
[
  { "id": 1, "name": "Alice", "active": true }
]
:::
    `;

    const { envelope, diagnostics } = parseLabMarkdown(md, 'sql_worker');
    expect(diagnostics).toHaveLength(0);
    expect(envelope.sandboxType).toBe('sql_worker');
    if (envelope.sandboxType === 'sql_worker') {
      expect(envelope.config?.schemaSql).toContain('CREATE TABLE users');
      expect(envelope.config?.seedSql).toContain('INSERT INTO users');
      expect(envelope.config?.expectedQueryResult).toEqual([
        { id: 1, name: 'Alice', active: true },
      ]);
    }
  });

  it('parses Quizlet lab with questions JSON block', () => {
    const md = `
# Indexing Quiz

:::quiz
[
  {
    "id": "q1",
    "question": "What is B-tree?",
    "options": ["Tree", "Graph"],
    "correctIndex": 0
  }
]
:::
    `;

    const { envelope, diagnostics } = parseLabMarkdown(md, 'quizlet');
    expect(diagnostics).toHaveLength(0);
    expect(envelope.sandboxType).toBe('quizlet');
    if (envelope.sandboxType === 'quizlet') {
      expect(envelope.config.questions).toHaveLength(1);
      expect(envelope.config.questions[0].id).toBe('q1');
    }
  });

  it('guarantees 100% round-trip fidelity: parse(serialize(dto)) == dto for all types', () => {
    const jsEnvelope: LabContentEnvelopeV1 = {
      version: '1.0',
      sandboxType: 'js_worker',
      instructions: '# Test Lab\nDetailed description.',
      initialSnippet: 'const x = 1;',
      testScript: 'expect(x).toBe(1);',
      solution: 'const x = 1;',
    };

    const sqlEnvelope: LabContentEnvelopeV1 = {
      version: '1.0',
      sandboxType: 'sql_worker',
      instructions: '# SQL Lab\nFind items.',
      initialSnippet: 'SELECT * FROM items;',
      solution: 'SELECT * FROM items ORDER BY id;',
      config: {
        version: '1.0',
        schemaSql: 'CREATE TABLE items (id int);',
        seedSql: 'INSERT INTO items VALUES (1);',
        expectedQueryResult: [{ id: 1 }],
      },
    };

    const quizEnvelope: LabContentEnvelopeV1 = {
      version: '1.0',
      sandboxType: 'quizlet',
      instructions: '# Quiz Lab\nAnswer questions.',
      solution: 'Review notes.',
      config: {
        version: '1.0',
        questions: [
          {
            id: 'q1',
            question: 'Question 1',
            options: ['Opt A', 'Opt B'],
            correctIndex: 0,
            explanation: 'Why A is right',
          },
        ],
      },
    };

    // 1. JS Round trip
    const jsSerialized = serializeLabMarkdown(jsEnvelope);
    const jsParsed = parseLabMarkdown(jsSerialized, 'js_worker');
    expect(jsParsed.envelope).toEqual(jsEnvelope);

    // 2. SQL Round trip
    const sqlSerialized = serializeLabMarkdown(sqlEnvelope);
    const sqlParsed = parseLabMarkdown(sqlSerialized, 'sql_worker');
    expect(sqlParsed.envelope).toEqual(sqlEnvelope);

    // 3. Quiz Round trip
    const quizSerialized = serializeLabMarkdown(quizEnvelope);
    const quizParsed = parseLabMarkdown(quizSerialized, 'quizlet');
    expect(quizParsed.envelope).toEqual(quizEnvelope);
  });

  it('detects unclosed blocks with line numbers in diagnostics', () => {
    const brokenMd = `
# Title

:::starter javascript
function broken() {
`;

    const { diagnostics } = parseLabMarkdown(brokenMd, 'js_worker');
    expect(diagnostics.some((d) => d.includes('Unclosed directive block') && d.includes('starter'))).toBe(true);
  });

  it('detects malformed JSON in expected block and records error', () => {
    const invalidJsonMd = `
# Title

:::expected
{ not valid json }
:::
`;

    const { diagnostics } = parseLabMarkdown(invalidJsonMd, 'sql_worker');
    expect(diagnostics.some((d) => d.includes('JSON syntax error'))).toBe(true);
  });
});
