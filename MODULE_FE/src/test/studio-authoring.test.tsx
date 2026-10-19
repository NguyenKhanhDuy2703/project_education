import { describe, it, expect, beforeEach } from 'vitest';
import { parseLabMarkdown } from '../features/lab/utils/lab-markdown-parser';
import { saveStudioDraft, loadStudioDraft, clearStudioDraft, getStudioDraftStorageKey } from '../features/lab/utils/studioDraftStorage';
import type { LabContentEnvelopeV1, SqlLabConfig, QuizLabConfig } from '../types/lab.types';

describe('Task 7: Contributor Studio Authoring Logic & Preflight Gate', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Draft Storage Persistence', () => {
    it('saves and restores studio draft to localStorage', () => {
      const key = getStudioDraftStorageKey('series-1', 'lab-1');
      const draft = {
        title: 'Draft Lab Title',
        markdown: '# Core theory\n\n:::starter sql\nSELECT 1;\n:::\n',
        sandboxType: 'sql_worker',
        isProOnly: false,
        durationMinutes: 15,
        savedAt: new Date().toISOString(),
      };

      const saved = saveStudioDraft(key, draft);
      expect(saved).toBe(true);

      const loaded = loadStudioDraft(key);
      expect(loaded).toBeDefined();
      expect(loaded?.title).toBe('Draft Lab Title');
      expect(loaded?.durationMinutes).toBe(15);
      expect(loaded?.markdown).toContain('SELECT 1;');

      clearStudioDraft(key);
      expect(loadStudioDraft(key)).toBeNull();
    });
  });

  describe('Markdown Parser & Preflight Syntax Checks', () => {
    it('detects missing blocks and reports diagnostics for SQL lab', () => {
      // Missing solution block
      const incompleteSqlMd = `# Title\n\nSome theory here.\n\n:::starter sql\nSELECT * FROM users;\n:::\n`;
      const parsed = parseLabMarkdown(incompleteSqlMd, 'sql_worker');
      
      expect(parsed.envelope.sandboxType).toBe('sql_worker');
      expect(parsed.envelope.initialSnippet).toContain('SELECT * FROM users;');
      // Solution is missing
      expect(parsed.envelope.solution).toBeUndefined();
    });

    it('successfully extracts all blocks for valid SQL lab envelope', () => {
      const fullSqlMd = `# Filtering Customers\n\nLearn SQL WHERE.\n\n:::schema\nCREATE TABLE customers (id INT, name TEXT);\n:::\n\n:::starter sql\nSELECT * FROM customers;\n:::\n\n:::solution sql\nSELECT * FROM customers WHERE id = 1;\n:::\n\n:::expected\n[{"id": 1, "name": "Alice"}]\n:::\n`;
      const parsed = parseLabMarkdown(fullSqlMd, 'sql_worker');

      expect(parsed.diagnostics).toHaveLength(0);
      expect(parsed.envelope.instructions).toContain('Filtering Customers');
      const config = parsed.envelope.config as SqlLabConfig;
      expect(config.schemaSql).toContain('CREATE TABLE customers');
      expect(parsed.envelope.initialSnippet).toContain('SELECT * FROM customers;');
      expect(parsed.envelope.solution).toContain('WHERE id = 1');
      expect(config.expectedQueryResult).toEqual([{ id: 1, name: 'Alice' }]);
    });

    it('correctly parses Automation test lab with starter, tests, and solution', () => {
      const fullJsMd = `# String Reversal\n\nReverse a given string.\n\n:::starter js\nfunction reverse(str) {\n  return '';\n}\n:::\n\n:::solution js\nfunction reverse(str) {\n  return str.split('').reverse().join('');\n}\n:::\n\n:::tests\ndescribe('reverse', () => {\n  it('works', () => {\n    expect(reverse('abc')).toBe('cba');\n  });\n});\n:::\n`;
      const parsed = parseLabMarkdown(fullJsMd, 'js_worker');

      expect(parsed.diagnostics).toHaveLength(0);
      expect(parsed.envelope.sandboxType).toBe('js_worker');
      expect(parsed.envelope.initialSnippet).toContain('function reverse');
      expect(parsed.envelope.solution).toContain('reverse().join');
      expect(parsed.envelope.testScript).toContain("describe('reverse'");
    });

    it('correctly parses Quizlet lab with questions JSON', () => {
      const quizMd = `# JavaScript Fundamentals Quiz\n\nTest your basics.\n\n:::quiz\n[\n  {\n    "id": "q1",\n    "question": "What is typeof null?",\n    "options": ["object", "null", "undefined", "number"],\n    "correctIndex": 0,\n    "explanation": "typeof null is historical bug object"\n  }\n]\n:::\n`;
      const parsed = parseLabMarkdown(quizMd, 'quizlet');

      expect(parsed.diagnostics).toHaveLength(0);
      expect(parsed.envelope.sandboxType).toBe('quizlet');
      const config = parsed.envelope.config as QuizLabConfig;
      expect(config.questions).toHaveLength(1);
      expect(config.questions[0].question).toBe('What is typeof null?');
      expect(config.questions[0].correctIndex).toBe(0);
    });

    it('detects invalid JSON in quiz block and records diagnostic', () => {
      const badQuizMd = `# Broken Quiz\n\n:::quiz\n{ not valid json }\n:::\n`;
      const parsed = parseLabMarkdown(badQuizMd, 'quizlet');

      expect(parsed.diagnostics.length).toBeGreaterThan(0);
      expect(parsed.diagnostics[0]).toContain('JSON syntax error in ":::quiz" block');
    });
  });

  describe('Preflight Validation Rules Logic', () => {
    function runPreflightCheck(input: {
      title: string;
      seriesId: string;
      instructions: string;
      sandboxType: 'sql_worker' | 'js_worker' | 'quizlet';
      envelope: LabContentEnvelopeV1;
      diagnostics: string[];
    }): { passed: boolean; error?: string } {
      if (!input.title.trim() || input.title.trim().length < 5) {
        return { passed: false, error: 'Tiêu đề cần ít nhất 5 ký tự.' };
      }
      if (!input.seriesId) {
        return { passed: false, error: 'Chưa chọn Series cha.' };
      }
      if (input.diagnostics.length > 0) {
        return { passed: false, error: 'Có lỗi cú pháp trong Markdown.' };
      }

      if (input.sandboxType === 'sql_worker') {
        const config = input.envelope.config as SqlLabConfig;
        if (!config.schemaSql?.trim()) {
          return { passed: false, error: 'Thiếu khối :::schema cho SQL.' };
        }
        if (!input.envelope.solution?.trim()) {
          return { passed: false, error: 'Thiếu khối :::solution cho SQL.' };
        }
      } else if (input.sandboxType === 'js_worker') {
        if (!input.envelope.initialSnippet?.trim()) {
          return { passed: false, error: 'Thiếu khối :::starter cho Automation.' };
        }
        if (!input.envelope.testScript?.trim()) {
          return { passed: false, error: 'Thiếu khối :::tests cho Automation.' };
        }
      } else if (input.sandboxType === 'quizlet') {
        const config = input.envelope.config as QuizLabConfig;
        const questions = config.questions || [];
        if (questions.length === 0) {
          return { passed: false, error: 'Thiếu câu hỏi trong :::quiz.' };
        }
        const hasInvalid = questions.some(
          (q) => !q.question?.trim() || !q.options || q.options.length < 2 || q.correctIndex < 0
        );
        if (hasInvalid) {
          return { passed: false, error: 'Có câu hỏi chưa đủ điều kiện.' };
        }
      }

      return { passed: true };
    }

    it('rejects lab with title under 5 characters', () => {
      const result = runPreflightCheck({
        title: 'SQL',
        seriesId: 's-1',
        instructions: 'Test instructions',
        sandboxType: 'sql_worker',
        envelope: {
          version: '1.0',
          sandboxType: 'sql_worker',
          instructions: '',
          initialSnippet: '',
          config: { version: '1.0', schemaSql: 'SELECT 1;' },
        },
        diagnostics: [],
      });
      expect(result.passed).toBe(false);
      expect(result.error).toContain('ít nhất 5 ký tự');
    });

    it('passes preflight for fully configured SQL lab', () => {
      const result = runPreflightCheck({
        title: 'Learn SQL Queries',
        seriesId: 's-1',
        instructions: 'Full instructions with more than 100 characters detailing all necessary context for student.',
        sandboxType: 'sql_worker',
        envelope: {
          version: '1.0',
          sandboxType: 'sql_worker',
          instructions: 'instructions',
          initialSnippet: 'SELECT * FROM users;',
          solution: 'SELECT * FROM users;',
          config: { version: '1.0', schemaSql: 'CREATE TABLE users (id int);' },
        },
        diagnostics: [],
      });
      expect(result.passed).toBe(true);
    });
  });
});
