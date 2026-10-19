import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PgEngineCore } from '../features/lab/sql-engine/PgEngineCore';

describe('PgEngineCore Lifecycle and PostgreSQL 16 Parity', () => {
  let engine: PgEngineCore;

  const schema = `
    CREATE TABLE departments (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL
    );

    CREATE TABLE employees (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      department_id INT REFERENCES departments(id),
      salary NUMERIC(10, 2) NOT NULL
    );
  `;

  const seed = `
    INSERT INTO departments (name) VALUES ('Engineering'), ('Marketing'), ('Sales');
    INSERT INTO employees (name, department_id, salary) VALUES
      ('Alice', 1, 90000),
      ('Bob', 1, 85000),
      ('Charlie', 2, 70000),
      ('Diana', 3, 65000);
  `;

  beforeEach(async () => {
    engine = new PgEngineCore();
    await engine.initialize(schema, seed);
  }, 90000);

  afterEach(async () => {
    await engine.dispose();
  });

  it('correctly executes JOIN, GROUP BY, and HAVING', async () => {
    const query = `
      SELECT d.name AS dept_name, COUNT(e.id) AS emp_count, AVG(e.salary)::INT AS avg_sal
      FROM departments d
      JOIN employees e ON d.id = e.department_id
      GROUP BY d.name
      HAVING COUNT(e.id) > 1;
    `;

    const result = await engine.execute(query);
    expect(result.error).toBeUndefined();
    expect(result.columns).toEqual(['dept_name', 'emp_count', 'avg_sal']);
    expect(result.rowCount).toBe(1);
    expect(result.rows[0].dept_name).toBe('Engineering');
    expect(Number(result.rows[0].emp_count)).toBe(2);
  });

  it('correctly executes Common Table Expression (CTE) and Window Function', async () => {
    const query = `
      WITH RankedEmployees AS (
        SELECT name, salary, DENSE_RANK() OVER (ORDER BY salary DESC) as rank
        FROM employees
      )
      SELECT name, salary, rank
      FROM RankedEmployees
      WHERE rank = 1;
    `;

    const result = await engine.execute(query);
    expect(result.error).toBeUndefined();
    expect(result.rowCount).toBe(1);
    expect(result.rows[0].name).toBe('Alice');
    expect(Number(result.rows[0].rank)).toBe(1);
  });

  it('introspects schema overview with tables, columns, primary keys and sample rows', async () => {
    const overview = await engine.getSchemaOverview();
    expect(overview.length).toBe(2);

    const deptTable = overview.find((t) => t.tableName === 'departments');
    expect(deptTable).toBeDefined();
    expect(deptTable?.columns.some((c) => c.name === 'id' && c.isPrimaryKey)).toBe(true);
    expect(deptTable?.sampleRows?.length).toBe(3);
    expect(deptTable?.totalRows).toBe(3);

    const empTable = overview.find((t) => t.tableName === 'employees');
    expect(empTable).toBeDefined();
    expect(empTable?.totalRows).toBe(4);
  });

  it('survives 20 consecutive reset cycles without state bleeding', async () => {
    for (let cycle = 1; cycle <= 20; cycle++) {
      // Insert a dirty row in cycle
      await engine.execute(`INSERT INTO departments (name) VALUES ('Temporary_${cycle}');`);
      const checkBefore = await engine.execute(`SELECT count(*) as count FROM departments;`);
      expect(Number(checkBefore.rows[0].count)).toBe(4);

      // Reset
      await engine.reset();

      // Check clean state
      const checkAfter = await engine.execute(`SELECT count(*) as count FROM departments;`);
      expect(Number(checkAfter.rows[0].count)).toBe(3);
    }
  });

  it('returns clean error message on invalid SQL syntax', async () => {
    const res = await engine.execute('SELECT FROM WHERE ;');
    expect(res.error).toBeDefined();
    expect(res.rows).toEqual([]);
  });

  it('rejects results that exceed configured row or column limits', async () => {
    const tooManyRows = await engine.execute('SELECT * FROM employees;', {
      maxRows: 2,
    });
    expect(tooManyRows.error).toContain('row');

    const tooManyColumns = await engine.execute(
      'SELECT id, name, department_id, salary FROM employees LIMIT 1;',
      { maxColumns: 2 },
    );
    expect(tooManyColumns.error).toContain('columns');
  });
});
