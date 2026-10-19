export interface SqlGuardResult {
  allowed: boolean;
  sanitizedQuery?: string;
  error?: string;
}

export type SqlStatementPolicy = 'read_only' | 'mutable';

/**
 * Removes standard SQL comments (-- single line and /* multi-line *\/)
 * while preserving string literals ('...').
 */
export function stripSqlComments(sql: string): string {
  let result = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;
  let i = 0;

  while (i < sql.length) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    if (inLineComment) {
      if (char === '\n' || char === '\r') {
        inLineComment = false;
        result += char;
      }
      i++;
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    if (inSingleQuote) {
      result += char;
      if (char === "'") {
        if (nextChar === "'") {
          // Escaped quote ''
          result += nextChar;
          i += 2;
          continue;
        }
        inSingleQuote = false;
      }
      i++;
      continue;
    }

    if (inDoubleQuote) {
      result += char;
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped double quote ""
          result += nextChar;
          i += 2;
          continue;
        }
        inDoubleQuote = false;
      }
      i++;
      continue;
    }

    // Check for comment start
    if (char === '-' && nextChar === '-') {
      inLineComment = true;
      i += 2;
      continue;
    }

    if (char === '/' && nextChar === '*') {
      inBlockComment = true;
      i += 2;
      continue;
    }

    if (char === "'") {
      inSingleQuote = true;
      result += char;
      i++;
      continue;
    }

    if (char === '"') {
      inDoubleQuote = true;
      result += char;
      i++;
      continue;
    }

    result += char;
    i++;
  }

  return result;
}

/**
 * Checks for multiple SQL statements by looking for semicolons outside of quotes.
 */
export function hasMultipleStatements(sqlWithoutComments: string): boolean {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let semicolonCount = 0;
  const trimmed = sqlWithoutComments.trim();

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    const nextChar = trimmed[i + 1];

    if (inSingleQuote) {
      if (char === "'") {
        if (nextChar === "'") {
          i++;
        } else {
          inSingleQuote = false;
        }
      }
      continue;
    }

    if (inDoubleQuote) {
      if (char === '"') {
        if (nextChar === '"') {
          i++;
        } else {
          inDoubleQuote = false;
        }
      }
      continue;
    }

    if (char === "'") {
      inSingleQuote = true;
      continue;
    }

    if (char === '"') {
      inDoubleQuote = true;
      continue;
    }

    if (char === ';') {
      // If it's the very last non-whitespace character, it's a trailing semicolon (allowed)
      const rest = trimmed.slice(i + 1).trim();
      if (rest.length > 0) {
        return true;
      }
      semicolonCount++;
    }
  }

  return semicolonCount > 1;
}

/**
 * Guards SQL queries for student practice labs:
 * - Only single read statement allowed: SELECT, WITH, EXPLAIN
 * - Reject DDL/DML: INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, GRANT, etc.
 * - Reject multi-statement execution / SQL injection attempts
 */
export function validateSqlQuery(
  rawSql: string,
  policy: SqlStatementPolicy = 'read_only',
): SqlGuardResult {
  if (!rawSql || !rawSql.trim()) {
    return {
      allowed: false,
      error: 'Query is empty. Please enter a SQL query.',
    };
  }

  const cleanSql = stripSqlComments(rawSql).trim();
  if (!cleanSql) {
    return {
      allowed: false,
      error: 'Query contains only comments. Please write a SQL statement.',
    };
  }

  if (hasMultipleStatements(cleanSql)) {
    return {
      allowed: false,
      error: 'Multiple SQL statements are not permitted in practice labs.',
    };
  }

  // Remove single trailing semicolon for keyword checks
  const sanitized = cleanSql.replace(/;\s*$/, '').trim();

  // Match initial command keyword
  const firstWordMatch = sanitized.match(/^[a-zA-Z]+/);
  if (!firstWordMatch) {
    return {
      allowed: false,
      error: 'Invalid SQL syntax or unrecognized statement.',
    };
  }

  const firstWord = firstWordMatch[0].toUpperCase();
  const readOnlyRoots = ['SELECT', 'WITH', 'EXPLAIN'];
  const mutableRoots = [
    ...readOnlyRoots,
    'INSERT',
    'UPDATE',
    'DELETE',
    'CREATE',
    'ALTER',
    'DROP',
    'TRUNCATE',
  ];
  const allowedRoots = policy === 'mutable' ? mutableRoots : readOnlyRoots;

  if (!allowedRoots.includes(firstWord)) {
    return {
      allowed: false,
      error: `SQL policy "${policy}" does not allow statements starting with "${firstWord}"; this command is prohibited.`,
    };
  }

  const alwaysForbiddenPattern =
    /\b(COPY\b|DO\s+\$|CALL\b|LOAD\b|VACUUM\b|GRANT\b|REVOKE\b|ALTER\s+SYSTEM|CREATE\s+EXTENSION)/i;
  if (alwaysForbiddenPattern.test(sanitized)) {
    return {
      allowed: false,
      error: 'This statement is not available in the learning sandbox.',
    };
  }

  if (/^EXPLAIN\s+(?:\([^)]*\bANALYZE\b[^)]*\)|ANALYZE\b)/i.test(sanitized)) {
    return {
      allowed: false,
      error: 'EXPLAIN ANALYZE is disabled because it executes the explained statement.',
    };
  }

  if (policy === 'read_only') {
    const dataChangingPattern =
      /\b(INSERT\s+INTO|DELETE\s+FROM|UPDATE\s+[a-zA-Z_]|DROP\s+(?:TABLE|SCHEMA)|ALTER\s+(?:TABLE|SCHEMA)|TRUNCATE\s+TABLE|CREATE\s+(?:TABLE|SCHEMA|VIEW|FUNCTION))\b/i;
    if (dataChangingPattern.test(sanitized)) {
      return {
        allowed: false,
        error: 'This lab is read-only. Data manipulation and schema changes are not permitted.',
      };
    }
  }

  return {
    allowed: true,
    sanitizedQuery: sanitized,
  };
}
