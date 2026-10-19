  import type {
  LabContentEnvelopeV1,
  PracticeLabV1,
  LabDetail,
  SqlLabConfig,
  QuizLabConfig,
  AutomationTestConfig,
  AutomationExerciseV2,
  SandboxType,
} from '@/types/lab.types';

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
    const sqlConfig: SqlLabConfig = {
      version: parsedObjectiveConfig.version === '2.0' ? '2.0' : '1.0',
      schemaSql:
        raw.sqlSchema ||
        parsedObjectiveConfig.schemaSql ||
        parsedObjectiveConfig.sqlSchema ||
        '',
      seedSql: parsedObjectiveConfig.seedSql || undefined,
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
  } else {
    // Default to js_worker / automation test
    const isV2 =
      parsedObjectiveConfig._envelopeVersion === '2.0' ||
      parsedObjectiveConfig.version === '2.0' ||
      raw.version === '2.0' ||
      parsedObjectiveConfig.interactionMode !== undefined ||
      raw.interactionMode !== undefined ||
      Boolean(parsedObjectiveConfig.blanks) ||
      Boolean(raw.blanks);

    if (isV2) {
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

  return {
    id: raw.id || '',
    slug: raw.slug || '',
    seriesId: raw.seriesId || '',
    title: raw.title || '',
    order: raw.order || raw.orderIndex || 1,
    isProOnly: Boolean(raw.isProOnly),
    sandboxType,
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
