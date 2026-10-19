import type {
  LabContentEnvelopeV1,
  SandboxType,
  SqlLabConfig,
  QuizLabConfig,
  QuizQuestionV1,
} from '../../../types/lab.types';

export interface ParseLabMarkdownResult {
  envelope: LabContentEnvelopeV1;
  diagnostics: string[];
}

interface BlockDirective {
  type: string;
  arg?: string;
  startLine: number;
  lines: string[];
}

/**
 * Parses Markdown-first lab document into a typed LabContentEnvelopeV1.
 */
export function parseLabMarkdown(
  markdown: string,
  sandboxType: SandboxType = 'js_worker'
): ParseLabMarkdownResult {
  const diagnostics: string[] = [];
  const lines = markdown.split(/\r?\n/);

  const proseLines: string[] = [];
  const blocks: BlockDirective[] = [];

  let currentBlock: BlockDirective | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    if (currentBlock) {
      if (trimmed === ':::') {
        // End of block
        blocks.push(currentBlock);
        currentBlock = null;
      } else {
        currentBlock.lines.push(line);
      }
    } else {
      const match = trimmed.match(/^:::\s*([a-zA-Z0-9_-]+)(?:\s+([a-zA-Z0-9_-]+))?$/);
      if (match) {
        currentBlock = {
          type: match[1].toLowerCase(),
          arg: match[2],
          startLine: lineNum,
          lines: [],
        };
      } else {
        proseLines.push(line);
      }
    }
  }

  if (currentBlock) {
    diagnostics.push(
      `Unclosed directive block ":::${currentBlock.type}" starting at line ${currentBlock.startLine}. Missing closing ":::".`
    );
    blocks.push(currentBlock);
  }

  const instructions = proseLines.join('\n').trim();

  // Helper to get block content
  const getBlockContent = (type: string): string | undefined => {
    const found = blocks.find((b) => b.type === type);
    return found ? found.lines.join('\n').trim() : undefined;
  };

  const starterCode = getBlockContent('starter') || '';
  const testScript = getBlockContent('tests') || '';
  const solution = getBlockContent('solution');

  if (sandboxType === 'sql_worker') {
    const schemaSql = getBlockContent('schema') || '';
    const seedSql = getBlockContent('seed');
    const expectedRaw = getBlockContent('expected');
    let expectedQueryResult: Array<Record<string, unknown>> | undefined;

    if (expectedRaw) {
      try {
        const parsed = JSON.parse(expectedRaw);
        if (Array.isArray(parsed)) {
          expectedQueryResult = parsed;
        } else {
          diagnostics.push('":::expected" block must contain a valid JSON array of objects.');
        }
      } catch (err: unknown) {
        diagnostics.push(`JSON syntax error in ":::expected" block: ${(err as Error).message}`);
      }
    }

    const config: SqlLabConfig = {
      version: '1.0',
      schemaSql,
      seedSql: seedSql || undefined,
      expectedQueryResult,
    };

    return {
      envelope: {
        version: '1.0',
        sandboxType: 'sql_worker',
        instructions,
        initialSnippet: starterCode,
        testScript: testScript || undefined,
        solution: solution || undefined,
        config,
      },
      diagnostics,
    };
  }

  if (sandboxType === 'quizlet') {
    const quizRaw = getBlockContent('quiz');
    let questions: QuizQuestionV1[] = [];

    if (quizRaw) {
      try {
        const parsed = JSON.parse(quizRaw);
        if (Array.isArray(parsed)) {
          questions = parsed;
        } else {
          diagnostics.push('":::quiz" block must contain a valid JSON array of QuizQuestion objects.');
        }
      } catch (err: unknown) {
        diagnostics.push(`JSON syntax error in ":::quiz" block: ${(err as Error).message}`);
      }
    }

    const config: QuizLabConfig = {
      version: '1.0',
      questions,
    };

    return {
      envelope: {
        version: '1.0',
        sandboxType: 'quizlet',
        instructions,
        initialSnippet: starterCode || undefined,
        solution: solution || undefined,
        config,
      },
      diagnostics,
    };
  }

  // Default: js_worker
  return {
    envelope: {
      version: '1.0',
      sandboxType: 'js_worker',
      instructions,
      initialSnippet: starterCode,
      testScript: testScript || '',
      solution: solution || undefined,
    },
    diagnostics,
  };
}

/**
 * Serializes a LabContentEnvelopeV1 into a Markdown-first document.
 */
export function serializeLabMarkdown(envelope: LabContentEnvelopeV1): string {
  const parts: string[] = [];

  // 1. Prose instructions at top
  if (envelope.instructions) {
    parts.push(envelope.instructions.trim());
  }

  // 2. Specific sandbox blocks
  if (envelope.sandboxType === 'sql_worker') {
    if (envelope.config?.schemaSql) {
      parts.push(`:::schema\n${envelope.config.schemaSql.trim()}\n:::`);
    }
    if (envelope.config?.seedSql) {
      parts.push(`:::seed\n${envelope.config.seedSql.trim()}\n:::`);
    }
    if (envelope.initialSnippet) {
      parts.push(`:::starter sql\n${envelope.initialSnippet.trim()}\n:::`);
    }
    if (envelope.config?.expectedQueryResult && envelope.config.expectedQueryResult.length > 0) {
      parts.push(
        `:::expected\n${JSON.stringify(envelope.config.expectedQueryResult, null, 2)}\n:::`
      );
    }
    if (envelope.solution) {
      parts.push(`:::solution sql\n${envelope.solution.trim()}\n:::`);
    }
  } else if (envelope.sandboxType === 'quizlet') {
    if (envelope.config?.questions && envelope.config.questions.length > 0) {
      parts.push(`:::quiz\n${JSON.stringify(envelope.config.questions, null, 2)}\n:::`);
    }
    if (envelope.solution) {
      parts.push(`:::solution\n${envelope.solution.trim()}\n:::`);
    }
  } else {
    // js_worker
    if (envelope.initialSnippet) {
      parts.push(`:::starter javascript\n${envelope.initialSnippet.trim()}\n:::`);
    }
    if (envelope.testScript) {
      parts.push(`:::tests javascript\n${envelope.testScript.trim()}\n:::`);
    }
    if (envelope.solution) {
      parts.push(`:::solution javascript\n${envelope.solution.trim()}\n:::`);
    }
  }

  return parts.join('\n\n');
}
