import { SqlStatementPolicy } from './sql-lab.types';

export interface SqlPolicyResult {
  allowed: boolean;
  sql?: string;
  error?: string;
}

function stripComments(sql: string): string {
  let output = '';
  let single = false;
  let double = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];
    if (lineComment) {
      if (char === '\n' || char === '\r') {
        lineComment = false;
        output += char;
      }
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (single) {
      output += char;
      if (char === "'" && next === "'") {
        output += next;
        index += 1;
      } else if (char === "'") {
        single = false;
      }
      continue;
    }
    if (double) {
      output += char;
      if (char === '"' && next === '"') {
        output += next;
        index += 1;
      } else if (char === '"') {
        double = false;
      }
      continue;
    }
    if (char === '-' && next === '-') {
      lineComment = true;
      index += 1;
    } else if (char === '/' && next === '*') {
      blockComment = true;
      index += 1;
    } else {
      if (char === "'") single = true;
      if (char === '"') double = true;
      output += char;
    }
  }
  return output;
}

function hasMultipleStatements(sql: string): boolean {
  let single = false;
  let double = false;
  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];
    if (single) {
      if (char === "'" && next === "'") index += 1;
      else if (char === "'") single = false;
      continue;
    }
    if (double) {
      if (char === '"' && next === '"') index += 1;
      else if (char === '"') double = false;
      continue;
    }
    if (char === "'") single = true;
    else if (char === '"') double = true;
    else if (char === ';' && sql.slice(index + 1).trim()) return true;
  }
  return false;
}

export function validateSqlStatement(
  rawSql: string,
  policy: SqlStatementPolicy = 'read_only',
): SqlPolicyResult {
  const clean = stripComments(rawSql || '').trim();
  if (!clean) return { allowed: false, error: 'Submit a SQL statement before grading.' };
  if (hasMultipleStatements(clean)) {
    return { allowed: false, error: 'Only one SQL statement is allowed.' };
  }

  const sql = clean.replace(/;\s*$/, '').trim();
  const firstWord = sql.match(/^[a-zA-Z]+/)?.[0]?.toUpperCase();
  const readOnly = ['SELECT', 'WITH', 'EXPLAIN'];
  const mutable = [...readOnly, 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TRUNCATE'];
  if (!firstWord || !(policy === 'mutable' ? mutable : readOnly).includes(firstWord)) {
    return { allowed: false, error: `This lab does not allow ${firstWord || 'that'} statements.` };
  }
  if (/\b(COPY\b|DO\s+\$|CALL\b|LOAD\b|VACUUM\b|GRANT\b|REVOKE\b|ALTER\s+SYSTEM|CREATE\s+EXTENSION)/i.test(sql)) {
    return { allowed: false, error: 'This statement is unavailable in the learning sandbox.' };
  }
  if (/^EXPLAIN\s+(?:\([^)]*\bANALYZE\b[^)]*\)|ANALYZE\b)/i.test(sql)) {
    return { allowed: false, error: 'EXPLAIN ANALYZE is disabled.' };
  }
  if (
    policy === 'read_only' &&
    /\b(INSERT\s+INTO|DELETE\s+FROM|UPDATE\s+[a-zA-Z_]|DROP\s+(?:TABLE|SCHEMA)|ALTER\s+(?:TABLE|SCHEMA)|TRUNCATE\s+TABLE|CREATE\s+(?:TABLE|SCHEMA|VIEW|FUNCTION))\b/i.test(sql)
  ) {
    return { allowed: false, error: 'This lab is read-only.' };
  }
  return { allowed: true, sql };
}
