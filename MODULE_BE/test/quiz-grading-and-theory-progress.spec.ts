import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { QuizGradingService } from '../src/modules/labs/quiz-grading.service';
import { LabsService } from '../src/modules/labs/labs.service';
import { LearningProgressStatus, LearningUnitType, UserRole } from '@prisma/client';

describe('Task 2: Quiz Server-Grading, Security, and Theory Progress Lifecycle', () => {
  const quizObjective = JSON.stringify({
    config: {
      version: '1.0',
      passPercentage: 75,
      questions: [
        {
          id: 'q1',
          question: 'What is ISTQB Principle 1?',
          options: ['Testing shows presence of defects', 'Exhaustive testing is possible', 'No bugs exist', 'None'],
          correctIndex: 0,
          hint: 'Remember defect presence.',
          explanation: 'Testing shows presence of defects, not their absence.',
        },
        {
          id: 'q2',
          question: 'What is Pesticide Paradox?',
          options: ['Bugs disappear', 'Repeating same tests finds no new bugs', 'Testing is toxic', 'None'],
          correctIndex: 1,
          hint: 'Think about insecticides.',
          explanation: 'Repeating same tests ceases to find new defects.',
        },
        {
          id: 'q3',
          question: 'What is Defect Clustering?',
          options: ['Small modules contain most defects', 'Defects spread everywhere equally', 'Bugs love groups', 'None'],
          correctIndex: 0,
          hint: 'Pareto principle 80/20.',
          explanation: 'A small number of modules usually contain most of the defects.',
        },
        {
          id: 'q4',
          question: 'What is Early Testing?',
          options: ['Testing after release', 'Testing early in SDLC saves cost', 'Testing before breakfast', 'None'],
          correctIndex: 1,
          hint: 'Shift-left.',
          explanation: 'Testing activities should start as early as possible.',
        },
      ],
    },
  });

  const quizService = new QuizGradingService();

  describe('QuizGradingService Authoritative Evaluation', () => {
    it('correctly grades passing answers meeting the threshold (3/4 = 75% >= 75%)', () => {
      const submittedPayload = JSON.stringify({
        answers: {
          q1: 0, // correct
          q2: 1, // correct
          q3: 0, // correct
          q4: 3, // incorrect
        },
      });

      const result = quizService.grade({
        submittedCode: submittedPayload,
        objective: quizObjective,
      });

      assert.equal(result.status, 'passed');
      assert.equal(result.correctCount, 3);
      assert.equal(result.totalQuestions, 4);
      assert.equal(result.scorePercentage, 75);
      assert.equal(result.review.isPassed, true);
      assert.equal(result.review.details.length, 4);
      assert.equal(result.review.details[0].isCorrect, true);
      assert.equal(result.review.details[3].isCorrect, false);
      assert.equal(result.review.details[3].correctOptionIndex, 1);
    });

    it('correctly rejects failing answers below the threshold (2/4 = 50% < 75%)', () => {
      const submittedPayload = JSON.stringify({
        answers: {
          q1: 0, // correct
          q2: 0, // incorrect
          q3: 0, // correct
          q4: 0, // incorrect
        },
      });

      const result = quizService.grade({
        submittedCode: submittedPayload,
        objective: quizObjective,
      });

      assert.equal(result.status, 'failed');
      assert.equal(result.correctCount, 2);
      assert.equal(result.totalQuestions, 4);
      assert.equal(result.scorePercentage, 50);
      assert.equal(result.review.isPassed, false);
    });

    it('handles empty answers gracefully with 0 score', () => {
      const result = quizService.grade({
        submittedCode: '',
        objective: quizObjective,
      });

      assert.equal(result.status, 'failed');
      assert.equal(result.correctCount, 0);
      assert.equal(result.scorePercentage, 0);
    });
  });

  describe('Forged Pass & Answer Leak Prevention', () => {
    it('strips correctIndex, explanation, hint from findBySlug for regular learners', async () => {
      const mockPrisma: any = {
        lab: {
          findFirst: async () => ({
            id: 'lab-quiz-1',
            slug: 'testing-principles-quiz',
            title: 'Testing Principles Checkpoint',
            sandboxType: 'quizlet',
            unitType: 'quiz_checkpoint',
            objective: quizObjective,
            status: 'published',
            isFreePreview: true,
            authorId: 'author-user-id',
          }),
        },
        learningUnitProgress: {
          findUnique: async () => null,
        },
      };

      const mockEntitlements: any = {
        checkUserFeature: async () => ({ hasAccess: true, isBanned: false }),
      };

      const labsService = new LabsService(mockPrisma, mockEntitlements);

      // Call as ordinary student
      const learnerResult = await labsService.findBySlug('testing-principles-quiz', {
        userId: 'student-123',
        role: UserRole.user,
      });

      assert.ok(learnerResult.quizQuestions, 'Must return questions list');
      assert.equal(learnerResult.quizQuestions.length, 4);

      for (const q of learnerResult.quizQuestions) {
        assert.equal((q as any).correctIndex, undefined, 'correctIndex MUST NOT be leaked to learner');
        assert.equal((q as any).explanation, undefined, 'explanation MUST NOT be leaked to learner before submission');
        assert.equal((q as any).hint, undefined, 'private hint/grading key MUST NOT be leaked');
      }

      // Also verify config.questions is sanitized
      if (learnerResult.config?.questions) {
        for (const q of learnerResult.config.questions) {
          assert.equal(q.correctIndex, undefined, 'config.questions.correctIndex MUST NOT be leaked');
          assert.equal(q.explanation, undefined, 'config.questions.explanation MUST NOT be leaked');
        }
      }

      // Call as author or admin: author CAN see answers for editing/reviewing
      const authorResult = await labsService.findBySlug('testing-principles-quiz', {
        userId: 'author-user-id',
        role: UserRole.contributor,
      });

      assert.ok(authorResult.quizQuestions);
      assert.equal((authorResult.quizQuestions[0] as any).correctIndex, 0, 'Author must see correctIndex');
      assert.ok((authorResult.quizQuestions[0] as any).explanation, 'Author must see explanation');
    });

    it('ignores client-reported passed status in submit() and determines authoritative grade on server', async () => {
      let createdSubmission: any = null;
      let upsertedProgress: any = null;

      const mockPrisma: any = {
        lab: {
          findFirst: async () => ({
            id: 'lab-quiz-1',
            slug: 'testing-quiz',
            sandboxType: 'quizlet',
            unitType: 'quiz_checkpoint',
            objective: quizObjective,
            solution: null,
          }),
          findUnique: async () => ({
            id: 'lab-quiz-1',
            slug: 'testing-quiz',
            sandboxType: 'quizlet',
            unitType: 'quiz_checkpoint',
            objective: quizObjective,
            solution: null,
          }),
        },
        labSubmission: {
          create: async ({ data }: any) => {
            createdSubmission = data;
            return {
              id: 'sub-1',
              createdAt: new Date(),
              executionTimeMs: data.executionTimeMs,
              ...data,
            };
          },
        },
        learningUnitProgress: {
          findUnique: async () => null,
          create: async ({ data }: any) => {
            upsertedProgress = data;
            return data;
          },
          upsert: async ({ create }: any) => {
            upsertedProgress = create;
            return create;
          },
        },
      };

      const labsService = new LabsService(mockPrisma, null as any);

      // Malicious payload: client claims 'passed', but submits all wrong answers
      const forgedPayload = {
        submittedCode: JSON.stringify({
          answers: { q1: 3, q2: 3, q3: 3, q4: 3 }, // All wrong (0/4)
        }),
        status: 'passed' as const, // Forged claim!
        timeMs: 100,
        testLogs: 'Client says I passed!',
      };

      const response = await labsService.submit('lab-quiz-1', 'student-attacker', forgedPayload);

      // Server must override status to failed
      assert.equal(response.status, 'failed', 'Server MUST NOT accept client-forged passed status');
      assert.equal(createdSubmission.status, 'failed', 'Stored submission status must be failed');
      assert.equal(upsertedProgress.status, LearningProgressStatus.IN_PROGRESS, 'Unit must NOT be marked COMPLETED');
      assert.ok(response.review, 'Review details must be returned after grading');
      assert.equal(response.review.correctCount, 0);
    });
  });

  describe('Authoring Release Validations (Subtask 2.5)', () => {
    it('rejects an automation lab without gradingKey or gradingRules', async () => {
      const labsService = new LabsService({} as any, {} as any);

      const invalidAutomationLab = {
        sandboxType: 'automation_v3',
        unitType: LearningUnitType.automation_lab,
        objective: JSON.stringify({
          version: '3.0',
          allowedBlocks: [{ blockType: 'nav_goto' }],
          // No gradingRules and no gradingKey!
        }),
      };

      await assert.rejects(
        async () => {
          await labsService.validateAutomationLabForRelease(invalidAutomationLab);
        },
        /requires grading rules or grading key before review or publication/
      );
    });

    it('accepts an automation lab with valid gradingKey or gradingRules', async () => {
      const labsService = new LabsService({} as any, {} as any);

      const validLabWithKey = {
        sandboxType: 'automation_v3',
        unitType: LearningUnitType.automation_lab,
        objective: JSON.stringify({
          version: '3.0',
          gradingKey: {
            requiredSteps: [{ blockType: 'nav_goto' }],
          },
        }),
      };

      await assert.doesNotReject(async () => {
        await labsService.validateAutomationLabForRelease(validLabWithKey);
      });
    });

    it('rejects a quiz checkpoint without questions or with missing correctIndex', async () => {
      const labsService = new LabsService({} as any, {} as any);

      const invalidQuizLab = {
        sandboxType: 'quizlet',
        unitType: LearningUnitType.quiz_checkpoint,
        objective: JSON.stringify({
          questions: [
            { id: 'q1', question: 'No answer key?' /* missing correctIndex */ },
          ],
        }),
      };

      await assert.rejects(
        async () => {
          await labsService.validateQuizLabForRelease(invalidQuizLab);
        },
        /missing a valid correctIndex/
      );
    });
  });

  describe('Theory Progress Lifecycle & Idempotency (Subtask 2.2)', () => {
    it('starts theory progress to IN_PROGRESS and updates position', async () => {
      let savedRecord: any = null;

      const mockPrisma: any = {
        lab: {
          findFirst: async () => ({
            id: 'theory-1',
            slug: 'seven-testing-principles',
            unitType: LearningUnitType.theory,
            sandboxType: 'markdown_only',
          }),
        },
        learningUnitProgress: {
          findUnique: async () => savedRecord,
          create: async ({ data }: any) => {
            savedRecord = { id: 'prog-1', ...data };
            return savedRecord;
          },
          update: async ({ data }: any) => {
            savedRecord = { ...savedRecord, ...data };
            return savedRecord;
          },
          upsert: async ({ create, update }: any) => {
            if (!savedRecord) {
              savedRecord = { id: 'prog-1', ...create };
            } else {
              savedRecord = { ...savedRecord, ...update };
            }
            return savedRecord;
          },
        },
      };

      const labsService = new LabsService(mockPrisma, null as any);

      // 1. Initial get
      const initial = await labsService.getLearningProgress('seven-testing-principles', 'user-1');
      assert.equal(initial.status, LearningProgressStatus.NOT_STARTED);

      // 2. Start
      const started = await labsService.startTheoryProgress('seven-testing-principles', 'user-1');
      assert.equal(started.status, LearningProgressStatus.IN_PROGRESS);

      // 3. Update Position
      const updated = await labsService.updateTheoryPosition('seven-testing-principles', 'user-1', {
        scrollPercent: 65,
        formativeAnswers: { f1: 1 },
      });
      assert.equal(updated.status, LearningProgressStatus.IN_PROGRESS);
      assert.deepEqual(updated.lastPosition, { scrollPercent: 65, formativeAnswers: { f1: 1 } });

      // 4. Complete
      const completed = await labsService.completeTheoryProgress('seven-testing-principles', 'user-1', {
        score: 100,
      });
      assert.equal(completed.status, LearningProgressStatus.COMPLETED);
      assert.equal(completed.score, 100);

      // 5. Complete idempotency (calling complete again does not error and keeps COMPLETED)
      const reCompleted = await labsService.completeTheoryProgress('seven-testing-principles', 'user-1');
      assert.equal(reCompleted.status, LearningProgressStatus.COMPLETED);
    });
  });
});
