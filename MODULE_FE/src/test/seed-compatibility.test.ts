import { describe, it, expect } from 'vitest';
import { normalizeLabDetail } from '../features/lab/domain/labContentCodec';
import type { SqlLabConfig, QuizLabConfig, AutomationTestConfig } from '@/types/lab.types';

describe('Seed Labs Backward Compatibility Audit', () => {
  it('correctly normalizes legacy W3Schools SQL labs from seed.ts', () => {
    const customersSample = [
      { CustomerID: 1, CustomerName: 'Alfreds', Country: 'Germany' },
      { CustomerID: 2, CustomerName: 'Ana', Country: 'Mexico' },
    ];

    const legacySqlLab = {
      id: 'lab-sql-01',
      slug: 'w3schools-sql-01-select',
      title: 'W3Schools SQL 01: SELECT',
      sandboxType: 'sql_worker',
      objective: JSON.stringify({
        summary: 'Lấy tất cả cột từ bảng Customers',
        sampleData: customersSample,
        expectedQueryResult: customersSample,
      }),
      instructions: 'Select everything from Customers',
      initialSnippet: 'SELECT * FROM Customers;',
      testScript: 'assert(true);',
      solution: 'SELECT * FROM Customers;',
    };

    const normalized = normalizeLabDetail(legacySqlLab);

    expect(normalized.sandboxType).toBe('sql_worker');
    expect(normalized.envelope.sandboxType).toBe('sql_worker');
    const config = normalized.envelope.config as SqlLabConfig;
    expect(config.version).toBe('1.0');
    // Legacy JSON sample rows are display data, not executable SQL.
    expect(config.seedSql).toBeUndefined();
    expect(config.expectedQueryResult).toEqual(customersSample);
    expect(normalized.envelope.instructions).toBe('Select everything from Customers');
  });

  it('correctly normalizes legacy Quizlet labs from seed.ts', () => {
    const quizQuestions = [
      {
        id: 'q1',
        question: 'HTTP Status 401 vs 403',
        options: ['401', '403'],
        correctIndex: 0,
        explanation: '401 is unauthorized',
      },
    ];

    const legacyQuizLab = {
      id: 'lab-quiz-01',
      slug: 'quiz-auth-rbac-analysis',
      title: 'Phân Tích Tình Huống: Auth & RBAC',
      sandboxType: 'quizlet',
      objective: JSON.stringify({
        summary: '3 tình huống trắc nghiệm phân tích mã lỗi HTTP',
        quizList: quizQuestions,
      }),
      instructions: 'Instructions here',
      initialSnippet: '// Choose answer',
      testScript: 'assert(true);',
      solution: '1. A',
    };

    const normalized = normalizeLabDetail(legacyQuizLab);

    expect(normalized.sandboxType).toBe('quizlet');
    const config = normalized.envelope.config as QuizLabConfig;
    expect(config.version).toBe('1.0');
    expect(config.questions).toHaveLength(1);
    expect(config.questions[0].id).toBe('q1');
    expect(config.allowReviewBeforeSubmit).toBe(true);
    expect(config.passPercentage).toBe(80);
  });

  it('correctly normalizes legacy JS/Automation labs from seed.ts', () => {
    const legacyJsLab = {
      id: 'lab-js-01',
      slug: 'api-automation-test-status-schema',
      title: 'API Automation Test',
      sandboxType: 'js_worker',
      objective: 'Viết test case kiểm tra status code 200 và schema json',
      instructions: 'Hướng dẫn automation',
      initialSnippet: '// your test code',
      testScript: 'assert(true);',
      solution: 'expect(res.status).toBe(200);',
    };

    const normalized = normalizeLabDetail(legacyJsLab);

    expect(normalized.sandboxType).toBe('js_worker');
    const config = normalized.envelope.config as AutomationTestConfig;
    expect(config.version).toBe('1.0');
    expect(config.cheatSheetVisible).toBe(true);
    expect(normalized.envelope.instructions).toBe('Hướng dẫn automation');
  });

  it('correctly normalizes upgraded V2 Smart Cloze automation lab from seed.ts', () => {
    const upgradedSeedLab = {
      id: 'lab-js-02',
      slug: 'api-automation-test-status-schema',
      title: 'Kiểm Thử Tích Hợp API: Xác Thực Response Status & Payload Schema',
      sandboxType: 'js_worker',
      objective: JSON.stringify({
        summary: 'Kiểm thử tích hợp API: Status code và Payload schema validation với Smart Cloaked Code',
        version: '2.0',
        interactionMode: 'smart_cloze',
        framework: 'api',
        publicTemplate: [
          { kind: 'managed', label: 'Framework setup & mock responses' },
          { kind: 'readonly', text: 'expect(mockSuccessResponse.status).toBe(' },
          { kind: 'blank', blankId: 'expectedSuccessCode' },
          { kind: 'readonly', text: ');' },
        ],
        blanks: [
          {
            id: 'expectedSuccessCode',
            kind: 'http_status',
            label: 'Mã HTTP Đăng Nhập Thành Công',
            valueType: 'number',
            defaultValue: 200,
          },
        ],
      }),
      instructions: 'Hướng dẫn Smart Cloze',
      initialSnippet: '// starter snippet',
      testScript: 'assert(true);',
    };

    const normalized = normalizeLabDetail(upgradedSeedLab as any);
    expect(normalized.envelope.version).toBe('2.0');
    const config = normalized.envelope.config as any;
    expect(config.interactionMode).toBe('smart_cloze');
    expect(config.framework).toBe('api');
    expect(config.blanks).toHaveLength(1);
    expect(config.blanks[0].defaultValue).toBe(200);
  });
});
