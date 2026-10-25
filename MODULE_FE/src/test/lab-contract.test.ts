import { describe, it, expect } from 'vitest';
import type { LabContentEnvelopeV1 } from '@/types/lab.types';

describe('Lab Content Contract V1 Type Suite (Subtask 2.1)', () => {
  it('enforces compile-time discrimination on sandboxType', () => {
    const handleEnvelope = (env: LabContentEnvelopeV1): string => {
      switch (env.sandboxType) {
        case 'js_worker':
          return `automation:${env.config?.targetFunction || 'default'}`;
        case 'sql_worker':
          return `sql:${env.config.schemaSql.length}`;
        case 'quizlet':
          return `quiz:${env.config.questions.length}`;
        case 'markdown_only':
          return 'theory:markdown';
        default: {
          const _exhaustive: never = env;
          return _exhaustive;
        }
      }
    };

    const jsEnv: LabContentEnvelopeV1 = {
      version: '1.0',
      sandboxType: 'js_worker',
      instructions: '# Test',
      initialSnippet: 'code()',
      testScript: 'expect(1).toBe(1)',
      config: {
        version: '1.0',
        targetFunction: 'validateUser',
      },
    };

    const sqlEnv: LabContentEnvelopeV1 = {
      version: '1.0',
      sandboxType: 'sql_worker',
      instructions: '# SQL',
      initialSnippet: 'SELECT * FROM users;',
      config: {
        version: '1.0',
        schemaSql: 'CREATE TABLE users (id int);',
      },
    };

    const quizEnv: LabContentEnvelopeV1 = {
      version: '1.0',
      sandboxType: 'quizlet',
      instructions: '# Quiz',
      config: {
        version: '1.0',
        questions: [
          {
            id: 'q1',
            question: 'What is SQL?',
            options: ['Query language', 'Coffee'],
            correctIndex: 0,
          },
        ],
      },
    };

    expect(handleEnvelope(jsEnv)).toBe('automation:validateUser');
    expect(handleEnvelope(sqlEnv)).toBe('sql:28');
    expect(handleEnvelope(quizEnv)).toBe('quiz:1');
  });
});
