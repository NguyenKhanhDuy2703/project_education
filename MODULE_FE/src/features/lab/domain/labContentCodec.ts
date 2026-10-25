import type {
  LabContentEnvelopeV1,
  PracticeLabV1,
  LabDetail,
  SqlLabConfig,
  QuizLabConfig,
  AutomationTestConfig,
  AutomationExerciseV2,
  AutomationExerciseV3,
  TheoryLessonConfig,
  LearningUnitType,
  SandboxType,
} from '@/types/lab.types';

export function inferLearningUnitType(
  rawUnitType?: string | null,
  sandboxType?: string | null,
): LearningUnitType {
  if (rawUnitType) {
    if (['theory', 'sql_practice', 'quiz_checkpoint', 'automation_lab'].includes(rawUnitType)) {
      return rawUnitType as LearningUnitType;
    }
  }

  if (sandboxType === 'markdown_only') {
    return 'theory';
  }
  if (sandboxType === 'sql_worker') {
    return 'sql_practice';
  }
  if (sandboxType === 'quizlet') {
    return 'quiz_checkpoint';
  }
  if (sandboxType === 'js_worker' || sandboxType === 'automation_v3') {
    return 'automation_lab';
  }
  return 'theory';
}

/**
 * Self-healing helper: synthesizes basic PostgreSQL DDL and INSERT statements
 * from sampleData when a legacy SQL lab record lacks schemaSql/seedSql.
 */
export function synthesizeSqlFromSampleData(
  sampleData: Array<Record<string, unknown>>,
  queryHint = '',
): { schemaSql: string; seedSql: string } {
  if (!Array.isArray(sampleData) || sampleData.length === 0) {
    return { schemaSql: '', seedSql: '' };
  }

  // Detect table name from query hint (e.g. FROM Customers or JOIN Products)
  const match = queryHint.match(/(?:FROM|JOIN)\s+["']?([a-zA-Z0-9_]+)["']?/i);
  let tableName = match ? match[1] : 'dataset';
  if (['table', 'order', 'user', 'group'].includes(tableName.toLowerCase())) {
    tableName = `"${tableName}"`;
  }

  const sampleRow = sampleData[0];
  const keys = Object.keys(sampleRow);
  if (keys.length === 0) return { schemaSql: '', seedSql: '' };

  const colDefs = keys.map((key) => {
    let colType = 'TEXT';
    const sampleVal = sampleData.find((r) => r[key] !== null && r[key] !== undefined)?.[key];
    if (typeof sampleVal === 'number') {
      colType = Number.isInteger(sampleVal) ? 'INTEGER' : 'NUMERIC';
    } else if (typeof sampleVal === 'boolean') {
      colType = 'BOOLEAN';
    }
    const isId = key.toLowerCase() === 'id' || key.toLowerCase().endsWith('id');
    const safeKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? key : `"${key.replace(/"/g, '""')}"`;
    return `${safeKey} ${colType}${isId ? ' PRIMARY KEY' : ''}`;
  });

  const schemaSql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${colDefs.join(',\n  ')}\n);`;

  const safeCols = keys.map((k) => (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k) ? k : `"${k.replace(/"/g, '""')}"`)).join(', ');
  const rowsSql = sampleData.map((row) => {
    const vals = keys.map((k) => {
      const v = row[k];
      if (v === null || v === undefined) return 'NULL';
      if (typeof v === 'number' || typeof v === 'boolean') return String(v);
      return `'${String(v).replace(/'/g, "''")}'`;
    });
    return `(${vals.join(', ')})`;
  });

  const seedSql = `INSERT INTO ${tableName} (${safeCols}) VALUES\n  ${rowsSql.join(',\n  ')};`;

  return { schemaSql, seedSql };
}

/**
 * Normalizes any legacy or versioned Lab record into a strictly-typed PracticeLabV1.
 */
export function normalizeLabDetail(
  raw: Partial<Omit<LabDetail, 'sandboxType'>> & { sandboxType?: string } & Record<string, any>,
): PracticeLabV1 {
  const sandboxType = (raw.sandboxType || 'js_worker') as SandboxType;
  let parsedObjectiveConfig: Record<string, any> = {};

  if (raw.config && typeof raw.config === 'object') {
    parsedObjectiveConfig = raw.config;
  } else if (raw.objective && typeof raw.objective === 'string') {
    const trimmed = raw.objective.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        parsedObjectiveConfig = parsed.config ? { ...parsed, ...parsed.config } : parsed;
      } catch {
        parsedObjectiveConfig = {};
      }
    }
  }

  const instructions = raw.instructions || '';
  const initialSnippet = raw.initialSnippet || '';
  const testScript = raw.testScript || '';
  const solution = raw.solution || undefined;

  let envelope: LabContentEnvelopeV1;

  if (sandboxType === 'sql_worker') {
    let finalSchemaSql =
      raw.sqlSchema ||
      parsedObjectiveConfig.schemaSql ||
      parsedObjectiveConfig.sqlSchema ||
      '';
    let finalSeedSql = parsedObjectiveConfig.seedSql || undefined;

    // Self-healing fallback: if schemaSql is empty but sampleData exists, synthesize schema & seed
    const rawSampleData = raw.sampleData || parsedObjectiveConfig.sampleData;
    if (!finalSchemaSql.trim() && Array.isArray(rawSampleData) && rawSampleData.length > 0) {
      const hint = `${instructions} ${initialSnippet} ${solution || ''}`;
      const synthesized = synthesizeSqlFromSampleData(rawSampleData, hint);
      if (synthesized.schemaSql) {
        finalSchemaSql = `${synthesized.schemaSql}\n\n${synthesized.seedSql}`.trim();
        // Keep finalSeedSql as undefined if not provided in config to preserve legacy compatibility
      }
    }

    const sqlConfig: SqlLabConfig = {
      version: parsedObjectiveConfig.version === '2.0' ? '2.0' : '1.0',
      schemaSql: finalSchemaSql,
      seedSql: finalSeedSql,
      expectedQueryResult:
        raw.expectedQueryResult ||
        parsedObjectiveConfig.expectedQueryResult ||
        undefined,
      expectedColumns: parsedObjectiveConfig.expectedColumns || undefined,
      orderSensitive: parsedObjectiveConfig.orderSensitive ?? false,
      sampleRowsVisible: parsedObjectiveConfig.sampleRowsVisible ?? true,
      statementPolicy: parsedObjectiveConfig.statementPolicy || 'read_only',
      timeoutMs: parsedObjectiveConfig.timeoutMs || 3000,
      maxResultRows: parsedObjectiveConfig.maxResultRows || 500,
      maxResultColumns: parsedObjectiveConfig.maxResultColumns || 50,
    };

    envelope = {
      version: '1.0',
      sandboxType: 'sql_worker',
      instructions,
      initialSnippet,
      testScript,
      solution,
      config: sqlConfig,
    };
  } else if (sandboxType === 'quizlet') {
    const rawQuestions =
      raw.quizQuestions ||
      raw.quizList ||
      parsedObjectiveConfig.quizQuestions ||
      parsedObjectiveConfig.quizList ||
      parsedObjectiveConfig.questions ||
      [];

    const quizConfig: QuizLabConfig = {
      version: '1.0',
      questions: Array.isArray(rawQuestions) ? rawQuestions : [],
      allowReviewBeforeSubmit: parsedObjectiveConfig.allowReviewBeforeSubmit ?? true,
      passPercentage: parsedObjectiveConfig.passPercentage ?? 80,
    };

    envelope = {
      version: '1.0',
      sandboxType: 'quizlet',
      instructions,
      initialSnippet,
      testScript,
      solution,
      config: quizConfig,
    };
  } else if (sandboxType === 'markdown_only') {
    const rawFormative =
      parsedObjectiveConfig.formativeQuestions ||
      parsedObjectiveConfig.questions ||
      raw.formativeQuestions ||
      [];
    const theoryConfig: TheoryLessonConfig = {
      version: parsedObjectiveConfig.version === '3.0' ? '3.0' : '1.0',
      readingTimeMinutes: parsedObjectiveConfig.readingTimeMinutes || raw.durationMinutes || 10,
      objectives: parsedObjectiveConfig.objectives || [],
      formativeQuestions: Array.isArray(rawFormative) ? rawFormative : [],
    };

    envelope = {
      version: theoryConfig.version || '1.0',
      sandboxType: 'markdown_only',
      instructions,
      initialSnippet,
      testScript,
      solution,
      config: theoryConfig,
    };
  } else {
    // Default to js_worker / automation test
    const isV3 =
      parsedObjectiveConfig._envelopeVersion === '3.0' ||
      parsedObjectiveConfig.version === '3.0' ||
      raw.version === '3.0' ||
      Boolean(parsedObjectiveConfig.fixture) ||
      Boolean(raw.fixture) ||
      Boolean(parsedObjectiveConfig.allowedBlocks) ||
      Boolean(raw.allowedBlocks);

    const isV2 =
      !isV3 &&
      (parsedObjectiveConfig._envelopeVersion === '2.0' ||
        parsedObjectiveConfig.version === '2.0' ||
        raw.version === '2.0' ||
        parsedObjectiveConfig.interactionMode !== undefined ||
        raw.interactionMode !== undefined ||
        Boolean(parsedObjectiveConfig.blanks) ||
        Boolean(raw.blanks));

    if (isV3) {
      const v3Config: AutomationExerciseV3 = {
        version: '3.0',
        framework: 'playwright',
        interactionMode: parsedObjectiveConfig.interactionMode || raw.interactionMode || 'block_builder',
        contentRevision: parsedObjectiveConfig.contentRevision || raw.contentRevision || 'rev-1',
        fixture: parsedObjectiveConfig.fixture || raw.fixture || {
          fixtureId: 'default',
          fixtureVersion: '1.0',
          initialRoute: '/',
        },
        allowedBlocks: parsedObjectiveConfig.allowedBlocks || raw.allowedBlocks || [],
        starterPlan: parsedObjectiveConfig.starterPlan || raw.starterPlan || [],
        publicChecks: parsedObjectiveConfig.publicChecks || raw.publicChecks || [],
        exportTemplate: parsedObjectiveConfig.exportTemplate || raw.exportTemplate || 'typescript',
        gradingRules: parsedObjectiveConfig.gradingRules || raw.gradingRules || undefined,
        gradingKey: parsedObjectiveConfig.gradingKey || raw.gradingKey || undefined,
        targetFunction: parsedObjectiveConfig.targetFunction || raw.targetFunction,
        title: parsedObjectiveConfig.title || raw.title,
        scenarioDescription: parsedObjectiveConfig.scenarioDescription || raw.scenarioDescription,
      };

      envelope = {
        version: '3.0',
        sandboxType: 'js_worker',
        instructions,
        initialSnippet,
        testScript,
        solution,
        config: v3Config,
      };
    } else if (isV2) {
      const v2Config: AutomationExerciseV2 = {
        version: '2.0',
        interactionMode: parsedObjectiveConfig.interactionMode || raw.interactionMode || 'smart_cloze',
        framework: parsedObjectiveConfig.framework || raw.framework || 'api',
        publicTemplate: parsedObjectiveConfig.publicTemplate || raw.publicTemplate || [],
        blanks: parsedObjectiveConfig.blanks || raw.blanks || [],
        publicChecks: parsedObjectiveConfig.publicChecks || raw.publicChecks || [],
        gradingRules: parsedObjectiveConfig.gradingRules || raw.gradingRules || [],
        targetFunction: parsedObjectiveConfig.targetFunction || raw.targetFunction,
        cheatSheetVisible: parsedObjectiveConfig.cheatSheetVisible ?? raw.cheatSheetVisible ?? true,
      };

      envelope = {
        version: '2.0',
        sandboxType: 'js_worker',
        instructions,
        initialSnippet,
        testScript,
        solution,
        config: v2Config,
      };
    } else {
      const autoConfig: AutomationTestConfig = {
        version: '1.0',
        targetFunction: parsedObjectiveConfig.targetFunction,
        steps: parsedObjectiveConfig.steps || [],
        cheatSheetVisible: parsedObjectiveConfig.cheatSheetVisible ?? true,
      };

      envelope = {
        version: '1.0',
        sandboxType: 'js_worker',
        instructions,
        initialSnippet,
        testScript,
        solution,
        config: autoConfig,
      };
    }
  }

  const unitType = inferLearningUnitType(raw.unitType, sandboxType);

  return {
    id: raw.id || '',
    slug: raw.slug || '',
    seriesId: raw.seriesId || '',
    title: raw.title || '',
    order: raw.order || raw.orderIndex || 1,
    isProOnly: Boolean(raw.isProOnly),
    sandboxType,
    unitType,
    sectionId: raw.sectionId || undefined,
    section: raw.section || undefined,
    progress: raw.progress || undefined,
    estimatedMinutes: raw.estimatedMinutes || raw.durationMinutes || 15,
    authorId: raw.authorId,
    authorName: raw.authorName,
    status: raw.status,
    envelope,
    isLocked: raw.isLocked,
    lockReason: raw.lockReason,
  };
}

/**
 * Serializes an envelope back to persistence fields (compatible with current Lab schema).
 */
export function serializeEnvelope(envelope: LabContentEnvelopeV1): {
  instructions: string;
  initialSnippet: string;
  testScript: string;
  solution?: string;
  objective: string;
} {
  const objectivePayload = {
    _envelopeVersion: envelope.version,
    sandboxType: envelope.sandboxType,
    config: envelope.config,
  };

  return {
    instructions: envelope.instructions,
    initialSnippet: envelope.initialSnippet || '',
    testScript: envelope.testScript || '',
    solution: envelope.solution,
    objective: JSON.stringify(objectivePayload),
  };
}
