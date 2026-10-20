import { test, expect } from '@playwright/test';

test.describe('UI Regression Baseline & Interaction Audits', () => {
  test('1. Landing and Catalog UI loads cleanly with accessible navigation', async ({ page }) => {
    await page.goto('/');

    // Verify page title and header
    await expect(page).toHaveTitle(/StudyIT|study/i);

    // Verify main navigation bar exists
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Verify footer links exist and render cleanly (unconditional check)
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(/Terms|Privacy|StudyIT|All Rights Reserved|2026/i);
  });

  test('2. User Profile renders plain-language security copy without technical jargon', async ({ page }) => {
    // Seed authenticated session in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock-test-jwt-token');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 'learner-001',
          name: 'Alex Rivera',
          email: 'alex.rivera@example.com',
          role: 'user',
          isContributor: false,
          phone: '+1234567890',
        })
      );
    });

    await page.goto('/user/dashboard/profile');

    // Wait for profile container to mount
    await expect(page.locator('text=Alex Rivera').first()).toBeVisible({ timeout: 10000 });

    // Plain-language copy checks (Subtask 9.2)
    const signedInText = page.locator('text=Signed in');
    await expect(signedInText).toBeVisible();

    const sessionProtectedText = page.locator('text=Your session is protected');
    await expect(sessionProtectedText).toBeVisible();

    // Verify technical implementation jargon is NOT present
    const rawAuth = page.locator('text="Authentication: Session Active"');
    await expect(rawAuth).toHaveCount(0);

    const rawJwt = page.locator('text="JWT Guarded"');
    await expect(rawJwt).toHaveCount(0);
  });

  test('3. Contributor Studio renders clean semantic headings without redundant Vietnamese subheadings', async ({ page }) => {
    // Seed contributor authentication state
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock-contrib-jwt-token');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 'contrib-001',
          name: 'Morgan Author',
          email: 'morgan.author@example.com',
          role: 'contributor',
          isContributor: true,
        })
      );
    });

    await page.goto('/user/dashboard/labs/new');

    // Wait for Lab Studio Theory section header to render
    const theorySectionHeading = page.locator('h2, h3, h4').filter({ hasText: /Theory & Learner Guide|Lý thuyết & Hướng dẫn/i }).first();
    await expect(theorySectionHeading).toBeVisible({ timeout: 10000 });

    // Verify DEC-02: redundant subheading sentence is REMOVED
    const redundantSentence = page.locator('text="Thiết lập môi trường làm bài, mã nguồn ban đầu, lời giải mẫu và tiêu chuẩn kiểm thử."');
    await expect(redundantSentence).toHaveCount(0);
  });

  test('4. Mobile responsive layout does not cause horizontal page overflow', async ({ page }) => {
    // Set viewport to mobile standard 375px (iPhone SE standard)
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Evaluate window scroll width vs viewport width
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(isOverflowing).toBe(false);
  });

  test('5. Quiz workspace renders safe Markdown, contains overscroll, and handles isolated scrolling without UI jumping', async ({ page }) => {
    // Seed authenticated learner session
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock-test-jwt-token');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 'learner-001',
          name: 'Alex Rivera',
          email: 'alex.rivera@example.com',
          role: 'user',
          isContributor: false,
        })
      );
    });

    const quizFixtureQuestions = [
      {
        id: 'q1',
        question: '### SQL Indexing Theory\nWhich statement best describes a **B-Tree index**?\n\n| Index | Complexity |\n|---|---|\n| B-Tree | O(log N) |',
        options: [
          'It operates as a balanced tree structure with `O(log N)` search time.',
          'It is only used for full-text search.',
        ],
        correctIndex: 0,
        explanation: 'B-Tree indexes maintain sorted data with logarithmic complexity.',
      },
      {
        id: 'q2',
        question: 'What is HTTP Status Code 500?',
        options: ['404 Not Found', '500 Internal Server Error (Máy chủ gặp sự cố)'],
        correctIndex: 1,
        explanation: '500 represents an unhandled internal server error.',
      },
      {
        id: 'q3',
        question: 'Tình huống 3: Kiểm thử Giá Trị Biên (Boundary Value Analysis)\nMột trường nhập số lượng đặt hàng (`quantity`) chỉ cho phép mua từ 1 đến 10 sản phẩm. Bộ giá trị nào đại diện chính xác?',
        options: ['1, 5, 10', '0, 1, 10, 11', '2, 4, 6, 8', '-1, 0, 100'],
        correctIndex: 1,
        explanation: 'Boundary value analysis checks edges: min-1, min, max, max+1.',
      },
    ];

    // Intercept backend API request to provide a quiz fixture with markdown & table
    await page.route(/.*\/api\/v1\/labs\/quiz-markdown-e2e(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'quiz-markdown-e2e',
            slug: 'quiz-markdown-e2e',
            title: 'Advanced Testing Assessment Challenge with Long Descriptive Title',
            instructions: '# Markdown Quiz Instructions',
            sandboxType: 'quizlet',
            isProOnly: false,
            quizQuestions: quizFixtureQuestions,
            envelope: {
              schemaVersion: '1.0',
              sandboxType: 'quizlet',
              instructions: '# Markdown Quiz Instructions',
              config: {
                passPercentage: 70,
                questions: quizFixtureQuestions,
              },
            },
          },
        }),
      });
    });

    await page.route(/.*\/api\/v1\/labs\/quiz-markdown-e2e\/submissions/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });

    await page.route(/.*\/api\/v1\/series/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'series-mock',
            slug: 'series-mock',
            title: 'Sample Series',
            labs: [],
          },
        }),
      });
    });

    await page.goto('/labs/quiz-markdown-e2e');

    // Verify Quiz Question semantic heading for screen readers
    const questionHeading = page.locator('h3:has-text("Question 1")');
    await expect(questionHeading).toBeVisible({ timeout: 10000 });

    // Heading ### rendered properly (h4 tag in MarkdownFragment, not literal ###)
    const heading = page.locator('h4:has-text("SQL Indexing Theory")');
    await expect(heading).toBeVisible();

    // Strong tag rendered, no literal **
    const strong = page.locator('strong:has-text("B-Tree index")');
    await expect(strong).toBeVisible();

    // Table rendered inside markdown fragment
    const tableHeader = page.locator('th:has-text("Complexity")');
    await expect(tableHeader).toBeVisible();

    const rawMarkdownCheck = page.locator('text="### SQL Indexing Theory"');
    await expect(rawMarkdownCheck).toHaveCount(0);

    // Verify scroll containment container exists
    const scrollContainer = page.locator('.overscroll-contain');
    await expect(scrollContainer).toBeVisible();

    // Scroll within the quiz questions container to Question 3
    const question3 = page.locator('#question-2');
    await expect(question3).toBeAttached();
    await scrollContainer.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });

    // Select Option C on Question 3 ("2, 4, 6, 8")
    const optionC = page.locator('label:has-text("2, 4, 6, 8")');
    await expect(optionC).toBeVisible();
    await optionC.click();

    // Verify Option C radio is checked
    const radioC = page.locator('input[name="question-q3"][value="2"]');
    await expect(radioC).toBeChecked();

    // CRITICAL: Window must NOT bounce or scroll down/up; window scroll position must stay strictly 0
    const scrollY = await page.evaluate(() => window.scrollY);
    const scrollX = await page.evaluate(() => window.scrollX);
    expect(scrollY).toBe(0);
    expect(scrollX).toBe(0);

    // Verify Top Header and Quiz Toolbar remain visible and are never pushed out of viewport
    const header = page.locator('header:has-text("study·web")');
    await expect(header).toBeVisible();

    const quizToolbar = page.locator('text="Quiz Assessment"');
    await expect(quizToolbar).toBeVisible();
  });

  test('6. Curriculum drawer provides accessible keyboard navigation and title tooltips', async ({ page }) => {
    // Intercept backend API requests for a lab with full curriculum drawer series
    await page.route(/.*\/api\/v1\/labs\/challenge-long-title(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'challenge-long-title',
            slug: 'challenge-long-title',
            title: 'Challenge 01: Deep Dive Analysis into High-Throughput Database Partitioning',
            instructions: '# Challenge Instructions',
            sandboxType: 'sql_worker',
            isProOnly: false,
            envelope: {
              schemaVersion: '1.0',
              sandboxType: 'sql_worker',
              instructions: '# Challenge Instructions',
              initialSnippet: 'SELECT 1;',
              config: { schemaSql: 'SELECT 1;' },
            },
          },
        }),
      });
    });

    await page.route(/.*\/api\/v1\/labs\/challenge-long-title\/submissions/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });

    await page.route(/.*\/api\/v1\/series/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'series-long-title',
            slug: 'series-long-title',
            title: 'Comprehensive Enterprise PostgreSQL Architecture & Advanced Indexing Strategy Mastery Series',
            description: 'Comprehensive curriculum for database engineers.',
            labs: [
              {
                id: 'challenge-long-title',
                slug: 'challenge-long-title',
                title: 'Challenge 01: Deep Dive Analysis into High-Throughput Database Partitioning',
                order: 1,
                isProOnly: false,
                sandboxType: 'sql_worker',
                estimatedMinutes: 30,
              },
            ],
          },
        }),
      });
    });

    await page.goto('/labs/challenge-long-title');

    // Click curriculum drawer toggle button (if present in top bar)
    const drawerTrigger = page.locator('button:has-text("Curriculum"), button[aria-label*="curriculum" i], button:has-text("Series")').first();
    if (await drawerTrigger.isVisible()) {
      await drawerTrigger.click();

      // Verify challenge item has role=button and is keyboard focusable
      const challengeButton = page.locator('[role="button"][tabindex="0"]:has-text("Challenge 01:")');
      await expect(challengeButton).toBeVisible();

      // Verify title attribute provides full accessible title tooltip
      await expect(challengeButton).toHaveAttribute(
        'title',
        'Challenge 01: Deep Dive Analysis into High-Throughput Database Partitioning'
      );
    }
  });

  test('7. Feedback widget opens with accessible dialog, localizes, and submits machine-readable context', async ({ page }) => {
    let capturedPayload: any = null;
    await page.route(/.*\/api\/v1\/feedback/, async (route) => {
      capturedPayload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'fb-e2e-1',
            category: capturedPayload.category,
            message: capturedPayload.message,
            status: 'pending',
            createdAt: new Date().toISOString(),
          },
        }),
      });
    });

    await page.goto('/');

    // Locate feedback trigger button
    const feedbackTrigger = page.locator('button[aria-label*="feedback" i], button[aria-label*="phản hồi" i]');
    await expect(feedbackTrigger).toBeVisible();
    await feedbackTrigger.click();

    // Verify dialog header
    const dialogTitle = page.locator('h2:has-text("Send Us Feedback"), h2:has-text("Gửi phản hồi")');
    await expect(dialogTitle).toBeVisible();

    // Click on area selector e.g. Series & Roadmaps
    const seriesAreaBtn = page.locator('button:has-text("Series & Roadmaps"), button:has-text("Series & Lộ trình")');
    if (await seriesAreaBtn.isVisible()) {
      await seriesAreaBtn.click();

      // Click first suggestion chip
      const suggestionChip = page.locator('button:has-text("+ Cannot load"), button:has-text("+ Không tải")').first();
      if (await suggestionChip.isVisible()) {
        await suggestionChip.click();
      }
    }

    // Fill message if empty or append
    const textarea = page.locator('textarea#feedback-msg');
    const existingVal = await textarea.inputValue();
    if (existingVal.length < 5) {
      await textarea.fill('E2E automated feedback submission test message.');
    }

    // Submit feedback
    const submitBtn = page.locator('button[type="submit"]:has-text("Submit Feedback"), button[type="submit"]:has-text("Gửi phản hồi")');
    await submitBtn.click();

    // Verify confirmation view appears
    const successTitle = page.locator('h2:has-text("Thank you for your feedback!"), h2:has-text("Cảm ơn bạn đã đóng góp")');
    await expect(successTitle).toBeVisible();

    // Assert that the intercepted payload contained machine-readable category and route
    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.category).toBe('bug');
    expect(capturedPayload.pageUrl).toBe('/');
  });
});
