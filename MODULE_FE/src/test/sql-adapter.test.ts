import { describe, it, expect } from 'vitest';
import { MockSqlEngineAdapter } from '../features/lab/sql-engine/SqlEngineAdapter';
import type { SqlEngineAdapter } from '../features/lab/sql-engine/types';

describe('SqlEngineAdapter contract', () => {
  it('implements complete lifecycle (initialize -> execute -> reset -> dispose)', async () => {
    const adapter: SqlEngineAdapter = new MockSqlEngineAdapter([
      {
        tableName: 'users',
        columns: [
          { name: 'id', type: 'integer', isPrimaryKey: true },
          { name: 'email', type: 'text', nullable: false },
        ],
      },
    ]);

    expect(adapter.status).toBe('uninitialized');
    await adapter.initialize('CREATE TABLE users (id int, email text);', 'INSERT INTO users VALUES (1, "a@b.com");');
    expect(adapter.status).toBe('ready');

    const schema = await adapter.getSchemaOverview();
    expect(schema).toHaveLength(1);
    expect(schema[0].tableName).toBe('users');

    const result = await adapter.execute('SELECT * FROM users');
    expect(result.columns).toEqual(['id', 'name']);
    expect(result.rowCount).toBe(1);
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);

    await adapter.reset();
    expect(adapter.status).toBe('ready');

    await adapter.dispose();
    expect(adapter.status).toBe('terminated');
  });
});
