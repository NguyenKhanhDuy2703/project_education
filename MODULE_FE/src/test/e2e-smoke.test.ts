import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defaultRefreshCoordinator } from '../features/auth/services/refreshCoordinator';
import { normalizeLabDetail } from '../features/lab/domain/labContentCodec';
import { getWorkspaceStrategy } from '../features/lab/strategies/workspaceRegistry';
import { gradeQuiz } from '../features/lab/quiz/quizGrading';
import { encodeQuizSubmission } from '../features/lab/quiz/quizSubmissionCodec';
import { PgEngineCore } from '../features/lab/sql-engine/PgEngineCore';
import { diffSqlResults } from '../features/lab/sql-engine/sqlDiff';

describe('Subtask 8.1: E2E Smoke Test Harness', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    defaultRefreshCoordinator.reset();
  });

  describe('Flow 1: User Session Handshake and Deduplicated Token Refresh', () => {
    it('successfully handles concurrent refresh calls deduplicating into a single HTTP exchange', async () => {
      let networkCalls = 0;
      const fakeApiRefresh = vi.fn().mockImplementation(async () => {
        networkCalls++;
        await new Promise((r) => setTimeout(r, 20));
        return 'fresh_jwt_token_xyz';
      });

      // Fire 3 simultaneous token refreshes (e.g. 3 components mounting at the same time)
      const [res1, res2, res3] = await Promise.all([
        defaultRefreshCoordinator.requestRefresh(fakeApiRefresh),
        defaultRefreshCoordinator.requestRefresh(fakeApiRefresh),
        defaultRefreshCoordinator.requestRefresh(fakeApiRefresh),
      ]);

      expect(networkCalls).toBe(1);
      expect(res1).toBe('fresh_jwt_token_xyz');
      expect(res2).toBe('fresh_jwt_token_xyz');
      expect(res3).toBe('fresh_jwt_token_xyz');
    });
  });

  describe('Flow 2: End-to-End Lab Contract Resolution & Strategy Mapping', () => {
    it('correctly maps all 3 sandbox types from raw API payload to strategy registry', () => {
      // 1. JS Worker
      const rawJs = {
        id: 'lab-js-1',
        title: 'JS Automation Lab',
        sandboxType: 'js_worker',
        instructions: 'Test instructions',
        initialSnippet: 'function add(a, b) { return a + b; }',
        testScript: "describe('add', () => { it('works', () => expect(add(1, 2)).toBe(3)); });",
      };
      const labJs = normalizeLabDetail(rawJs as any);
      expect(labJs.envelope.sandboxType).toBe('js_worker');
      const stratJs = getWorkspaceStrategy('js_worker');
      expect(stratJs).toBeDefined();

      // 2. SQL Worker
      const rawSql = {
        id: 'lab-sql-1',
        title: 'SQL Practice Lab',
        sandboxType: 'sql_worker',
        instructions: 'Query customers',
        sqlSchema: 'CREATE TABLE customers (id INT, name TEXT);',
        solution: 'SELECT * FROM customers;',
      };
      const labSql = normalizeLabDetail(rawSql as any);
      expect(labSql.envelope.sandboxType).toBe('sql_worker');
      const stratSql = getWorkspaceStrategy('sql_worker');
      expect(stratSql).toBeDefined();

      // 3. Quizlet
      const rawQuiz = {
        id: 'lab-quiz-1',
        title: 'TypeScript Quiz',
        sandboxType: 'quizlet',
        instructions: 'Answer all questions',
        quizQuestions: [
          {
            id: 'q1',
            question: 'What is TypeScript?',
            options: ['Typed superset of JS', 'A browser', 'A database', 'An OS'],
            correctIndex: 0,
            explanation: 'TypeScript adds static typing to JavaScript',
          },
        ],
      };
      const labQuiz = normalizeLabDetail(rawQuiz as any);
      expect(labQuiz.envelope.sandboxType).toBe('quizlet');
      const stratQuiz = getWorkspaceStrategy('quizlet');
      expect(stratQuiz).toBeDefined();
    });
  });

  describe('Flow 3: Complete Quiz Answering, Grading & Submission Codec', () => {
    it('grades questions accurately and packages into submission payload', () => {
      const questions = [
        { id: 'q1', question: 'Q1', options: ['A', 'B'], correctIndex: 0, explanation: 'Exp 1' },
        { id: 'q2', question: 'Q2', options: ['C', 'D'], correctIndex: 1, explanation: 'Exp 2' },
      ];

      // Student answers: Q1 -> 0 (correct), Q2 -> 0 (incorrect)
      const answers: Record<string, number> = { q1: 0, q2: 0 };
      const gradeResult = gradeQuiz(questions, answers, 70);

      expect(gradeResult.totalQuestions).toBe(2);
      expect(gradeResult.correctCount).toBe(1);
      expect(gradeResult.scorePercentage).toBe(50);
      expect(gradeResult.isPassed).toBe(false);

      // Package for submission API
      const encoded = encodeQuizSubmission({
        version: '1.0',
        scorePercentage: gradeResult.scorePercentage,
        correctCount: gradeResult.correctCount,
        totalQuestions: gradeResult.totalQuestions,
        answers,
        submittedAt: new Date().toISOString(),
      });
      expect(encoded).toContain('"version":"1.0"');
      expect(encoded).toContain('"scorePercentage":50');
      expect(encoded).toContain('"answers":{"q1":0,"q2":0}');
    });
  });

  describe('Flow 4: In-Memory SQL Execution & Diff Evaluation', () => {
    it('executes SQL in engine, computes diff vs expected result', async () => {
      const core = new PgEngineCore();
      const schemaSql = "CREATE TABLE products (id INT, title TEXT, price INT); INSERT INTO products VALUES (1, 'Laptop', 1200), (2, 'Mouse', 25);";
      await core.initialize(schemaSql);

      const actualSql = 'SELECT title, price FROM products WHERE price > 100 ORDER BY price DESC;';
      const actualRes = await core.execute(actualSql);
      expect(actualRes.rows).toEqual([{ title: 'Laptop', price: 1200 }]);
      expect(actualRes.columns).toEqual(['title', 'price']);

      const expectedRes = [{ title: 'Laptop', price: 1200 }];
      const diff = diffSqlResults(actualRes.rows, expectedRes, { orderSensitive: true });
      expect(diff.isMatch).toBe(true);
      expect(diff.rowDiffs).toHaveLength(1);
      expect(diff.rowDiffs[0].status).toBe('matched');
    });
  });
});
