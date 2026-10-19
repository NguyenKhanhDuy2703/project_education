import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SqlSchemaPreview } from '../features/lab/components/SqlSchemaPreview';
import type { TableSchema } from '../features/lab/sql-engine/types';

describe('SqlSchemaPreview Component', () => {
  const mockTables: TableSchema[] = [
    {
      tableName: 'users',
      totalRows: 2,
      columns: [
        { name: 'id', type: 'integer', isPrimaryKey: true, nullable: false },
        { name: 'email', type: 'text', isPrimaryKey: false, nullable: false },
      ],
      sampleRows: [
        { id: 1, email: 'alice@test.com' },
        { id: 2, email: 'bob@test.com' },
      ],
    },
    {
      tableName: 'orders',
      totalRows: 5,
      columns: [
        { name: 'order_id', type: 'integer', isPrimaryKey: true, nullable: false },
        { name: 'amount', type: 'numeric', isPrimaryKey: false, nullable: true },
      ],
    },
  ];

  it('renders table list and expands the first table by default', () => {
    render(<SqlSchemaPreview tables={mockTables} />);

    expect(screen.getByText('Database Schema (2 tables)')).toBeDefined();
    expect(screen.getByText('users')).toBeDefined();
    expect(screen.getByText('orders')).toBeDefined();

    // First table expanded: columns visible
    expect(screen.getAllByText('email').length).toBeGreaterThan(0);
    expect(screen.getByText('alice@test.com')).toBeDefined();
  });

  it('toggles accordion when clicking on a table button', () => {
    render(<SqlSchemaPreview tables={mockTables} />);

    const ordersBtn = screen.getByRole('button', { name: /orders/i });
    expect(ordersBtn).toBeDefined();

    // Before clicking, orders column 'order_id' should not be rendered
    expect(screen.queryByText('order_id')).toBeNull();

    // Click to expand
    fireEvent.click(ordersBtn);
    expect(screen.getByText('order_id')).toBeDefined();
    expect(screen.getByText('amount')).toBeDefined();

    // Click to collapse
    fireEvent.click(ordersBtn);
    expect(screen.queryByText('order_id')).toBeNull();
  });

  it('renders loading state when isLoading is true', () => {
    render(<SqlSchemaPreview tables={[]} isLoading={true} />);
    expect(screen.getByText(/Loading database schema/i)).toBeDefined();
  });

  it('renders empty message when no tables exist', () => {
    render(<SqlSchemaPreview tables={[]} />);
    expect(screen.getByText(/No tables found/i)).toBeDefined();
  });
});
