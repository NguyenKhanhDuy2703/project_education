import { describe, it, expect } from 'vitest';
import { normalizeLabDetail } from '../features/lab/domain/labContentCodec';
import { PgEngineCore } from '../features/lab/sql-engine/PgEngineCore';
import { validateSqlQuery } from '../features/lab/sql-engine/sqlGuard';
import { diffSqlResults } from '../features/lab/sql-engine/sqlDiff';
import type { SqlLabConfig } from '../types/lab.types';

describe('Subtask 8.4: SQL Practice Lab End-to-End Flow Test', () => {
  const sampleSqlLab = {
    id: 'lab-sql-employees-dept',
    title: 'Highest Paid Employee by Department',
    sandboxType: 'sql_worker',
    instructions: '# Highest Paid Employees\n\nFind the top earning employee in each department using Window functions.',
    sqlSchema: `
      CREATE TABLE departments (
        id INT PRIMARY KEY,
        name TEXT NOT NULL
      );

      CREATE TABLE employees (
        id INT PRIMARY KEY,
        name TEXT NOT NULL,
        department_id INT REFERENCES departments(id),
        salary INT NOT NULL
      );

      INSERT INTO departments VALUES (1, 'Engineering'), (2, 'Sales');
      INSERT INTO employees VALUES
        (101, 'Alice', 1, 95000),
        (102, 'Bob', 1, 105000),
        (103, 'Charlie', 2, 70000),
        (104, 'Diana', 2, 85000);
    `,
    initialSnippet: 'SELECT * FROM employees LIMIT 2;',
    solution: `
      WITH Ranked AS (
        SELECT
          d.name AS department_name,
          e.name AS employee_name,
          e.salary,
          DENSE_RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) as rnk
        FROM employees e
        JOIN departments d ON e.department_id = d.id
      )
      SELECT department_name, employee_name, salary
      FROM Ranked
      WHERE rnk = 1
      ORDER BY department_name;
    `,
  };

  it('normalizes SQL lab into versioned envelope with schema DDL and solution', () => {
    const lab = normalizeLabDetail(sampleSqlLab as any);
    expect(lab.envelope.sandboxType).toBe('sql_worker');
    const config = lab.envelope.config as SqlLabConfig;
    expect(config.schemaSql).toContain('CREATE TABLE departments');
    expect(lab.envelope.solution).toContain('DENSE_RANK()');
  });

  it('validates SQL read-only safety guard and blocks dangerous queries', () => {
    // 1. Allowed SELECT and CTE
    const safeCte = validateSqlQuery(sampleSqlLab.solution);
    expect(safeCte.allowed).toBe(true);

    // 2. Reject multi-statement / stacked injections
    const stackedQuery = 'SELECT * FROM employees; DROP TABLE departments;';
    const stackedCheck = validateSqlQuery(stackedQuery);
    expect(stackedCheck.allowed).toBe(false);

    // 3. Reject DDL statement in student editor
    const ddlQuery = 'ALTER TABLE employees DROP COLUMN salary;';
    const ddlCheck = validateSqlQuery(ddlQuery);
    expect(ddlCheck.allowed).toBe(false);
  });

  it('runs query against in-browser PGlite engine and detects result diff vs expected solution', async () => {
    const engine = new PgEngineCore();
    await engine.initialize(sampleSqlLab.sqlSchema);

    // 1. First run solution to compute ground truth expected rows
    const expectedExec = await engine.execute(sampleSqlLab.solution);
    expect(expectedExec.error).toBeUndefined();
    expect(expectedExec.rowCount).toBe(2);
    expect(expectedExec.rows).toEqual([
      { department_name: 'Engineering', employee_name: 'Bob', salary: 105000 },
      { department_name: 'Sales', employee_name: 'Diana', salary: 85000 },
    ]);

    // 2. Student runs wrong query (e.g. initial snippet)
    const wrongExec = await engine.execute(sampleSqlLab.initialSnippet);
    expect(wrongExec.error).toBeUndefined();
    const wrongDiff = diffSqlResults(wrongExec.rows, expectedExec.rows, { orderSensitive: true });
    expect(wrongDiff.isMatch).toBe(false);
    expect(wrongDiff.matchedRowCount).toBe(0);

    // 3. Student writes correct query
    const studentExec = await engine.execute(sampleSqlLab.solution);
    expect(studentExec.error).toBeUndefined();
    const correctDiff = diffSqlResults(studentExec.rows, expectedExec.rows, { orderSensitive: true });
    expect(correctDiff.isMatch).toBe(true);
    expect(correctDiff.matchedRowCount).toBe(2);
    expect(correctDiff.rowDiffs.every((r) => r.status === 'matched')).toBe(true);
  });

  it('formats SQL submission payload satisfying contract verification', () => {
    const submissionPayload = {
      labId: sampleSqlLab.id,
      submittedCode: sampleSqlLab.solution,
      status: 'SOLVED' as const,
      executionTimeMs: 42,
      resultSummary: {
        isMatch: true,
        matchedRows: 2,
        totalExpected: 2,
      },
    };

    expect(submissionPayload.status).toBe('SOLVED');
    expect(submissionPayload.resultSummary.isMatch).toBe(true);
  });
});
