import { describe, it, expect } from 'vitest';
import { validateSqlQuery, stripSqlComments, hasMultipleStatements } from '../features/lab/sql-engine/sqlGuard';

describe('sqlGuard Security Policy', () => {
  describe('stripSqlComments', () => {
    it('strips single-line comments', () => {
      const sql = 'SELECT * -- comment here\nFROM users;';
      expect(stripSqlComments(sql).trim()).toBe('SELECT * \nFROM users;');
    });

    it('strips multi-line comments', () => {
      const sql = 'SELECT /* secret comment */ id FROM users;';
      expect(stripSqlComments(sql).trim()).toBe('SELECT  id FROM users;');
    });

    it('preserves comment markers inside single-quoted strings', () => {
      const sql = "SELECT * FROM notes WHERE text = '-- not a comment /* still text */';";
      expect(stripSqlComments(sql).trim()).toBe(sql);
    });
  });

  describe('hasMultipleStatements', () => {
    it('detects multiple statements separated by semicolon', () => {
      expect(hasMultipleStatements('SELECT 1; DROP TABLE users;')).toBe(true);
      expect(hasMultipleStatements('SELECT 1; SELECT 2')).toBe(true);
    });

    it('allows a single trailing semicolon', () => {
      expect(hasMultipleStatements('SELECT * FROM users;')).toBe(false);
      expect(hasMultipleStatements('SELECT * FROM users')).toBe(false);
    });

    it('ignores semicolons inside string literals', () => {
      expect(hasMultipleStatements("SELECT * FROM users WHERE bio = 'developer; engineer; runner';")).toBe(false);
    });
  });

  describe('validateSqlQuery', () => {
    it('allows valid SELECT statements', () => {
      const res = validateSqlQuery('SELECT id, name FROM employees WHERE salary > 50000 ORDER BY salary DESC;');
      expect(res.allowed).toBe(true);
      expect(res.error).toBeUndefined();
      expect(res.sanitizedQuery).toBe('SELECT id, name FROM employees WHERE salary > 50000 ORDER BY salary DESC');
    });

    it('allows valid WITH CTE statements', () => {
      const query = `
        WITH dept_avg AS (
          SELECT dept_id, AVG(salary) as avg_sal FROM employees GROUP BY dept_id
        )
        SELECT * FROM dept_avg;
      `;
      const res = validateSqlQuery(query);
      expect(res.allowed).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('allows EXPLAIN statements', () => {
      const res = validateSqlQuery('EXPLAIN SELECT * FROM users;');
      expect(res.allowed).toBe(true);
    });

    it('rejects DROP TABLE statements', () => {
      const res = validateSqlQuery('DROP TABLE employees;');
      expect(res.allowed).toBe(false);
      expect(res.error?.toLowerCase()).toContain('prohibited');
    });

    it('rejects INSERT / UPDATE / DELETE statements', () => {
      expect(validateSqlQuery("INSERT INTO employees VALUES (1, 'Eve');").allowed).toBe(false);
      expect(validateSqlQuery("UPDATE employees SET salary = 999999;").allowed).toBe(false);
      expect(validateSqlQuery("DELETE FROM employees;").allowed).toBe(false);
    });

    it('rejects multi-statement SQL injection attempts', () => {
      const injection = 'SELECT * FROM users; DROP TABLE secret_data;';
      const res = validateSqlQuery(injection);
      expect(res.allowed).toBe(false);
      expect(res.error).toContain('Multiple SQL statements are not permitted');
    });

    it('rejects data-modifying statements embedded inside CTEs', () => {
      const sneakyCte = `
        WITH deleted_rows AS (
          DELETE FROM employees RETURNING *
        )
        SELECT * FROM deleted_rows;
      `;
      const res = validateSqlQuery(sneakyCte);
      expect(res.allowed).toBe(false);
      expect(res.error).toContain('Data manipulation');
    });

    it('allows isolated DML and DDL only for mutable labs', () => {
      expect(validateSqlQuery("INSERT INTO employees VALUES (1, 'Eve')", 'mutable').allowed).toBe(true);
      expect(validateSqlQuery('UPDATE employees SET salary = 10', 'mutable').allowed).toBe(true);
      expect(validateSqlQuery('CREATE TABLE notes (id INT)', 'mutable').allowed).toBe(true);
      expect(validateSqlQuery('CREATE TABLE notes (id INT)', 'read_only').allowed).toBe(false);
    });

    it('always blocks privileged or host-facing commands', () => {
      expect(validateSqlQuery("COPY employees TO '/tmp/data'", 'mutable').allowed).toBe(false);
      expect(validateSqlQuery("CREATE EXTENSION file_fdw", 'mutable').allowed).toBe(false);
      expect(validateSqlQuery("SET ROLE postgres", 'mutable').allowed).toBe(false);
      expect(validateSqlQuery("DO $$ BEGIN RAISE NOTICE 'x'; END $$", 'mutable').allowed).toBe(false);
    });

    it('blocks EXPLAIN ANALYZE because it executes the nested statement', () => {
      expect(validateSqlQuery('EXPLAIN ANALYZE SELECT * FROM employees').allowed).toBe(false);
      expect(validateSqlQuery('EXPLAIN (ANALYZE, FORMAT JSON) SELECT 1').allowed).toBe(false);
      expect(validateSqlQuery('EXPLAIN (FORMAT JSON) SELECT 1').allowed).toBe(true);
    });

    it('rejects empty query or comments-only query', () => {
      expect(validateSqlQuery('').allowed).toBe(false);
      expect(validateSqlQuery('   ').allowed).toBe(false);
      expect(validateSqlQuery('-- just a comment\n/* another comment */').allowed).toBe(false);
    });
  });
});
