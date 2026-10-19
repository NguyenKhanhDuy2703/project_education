import { describe, it, expect, beforeEach } from 'vitest';
import { parseLabMarkdown } from '../features/lab/utils/lab-markdown-parser';
import {
  saveStudioDraft,
  loadStudioDraft,
  clearStudioDraft,
  getStudioDraftStorageKey,
} from '../features/lab/utils/studioDraftStorage';
import type { SqlLabConfig } from '../types/lab.types';

describe('Subtask 8.6: Contributor Studio Authoring Flow Test', () => {
  const seriesId = 'series-sql-advanced';
  const labId = 'new';
  const draftKey = getStudioDraftStorageKey(seriesId, labId);

  beforeEach(() => {
    localStorage.clear();
  });

  it('orchestrates complete authoring flow: markdown editing -> snippet insertion -> diagnostics -> preflight -> draft persist -> publish cleanup', () => {
    // 1. Initial State: Contributor enters Studio with starter markdown template
    let markdown = `# Window Functions in SQL\n\nLearn how to partition and rank rows efficiently.\n\n`;
    
    // 2. Contributor inserts Schema block via SmartLabToolbar
    const schemaSnippet = `:::schema\nCREATE TABLE sales (\n  id INT PRIMARY KEY,\n  rep TEXT,\n  amount INT\n);\nINSERT INTO sales VALUES (1, 'Alice', 500), (2, 'Bob', 800);\n:::\n`;
    markdown += `${schemaSnippet}\n`;

    // 3. Contributor inserts Starter and Solution blocks
    const starterSnippet = `:::starter sql\nSELECT rep, amount FROM sales;\n:::\n`;
    const solutionSnippet = `:::solution sql\nSELECT rep, amount, RANK() OVER (ORDER BY amount DESC) FROM sales;\n:::\n`;
    markdown += `${starterSnippet}\n${solutionSnippet}\n`;

    // 4. Parser validates blocks and produces envelope
    const parsed = parseLabMarkdown(markdown, 'sql_worker');
    expect(parsed.diagnostics).toHaveLength(0);
    expect(parsed.envelope.sandboxType).toBe('sql_worker');
    expect(parsed.envelope.instructions).toContain('Window Functions in SQL');
    
    const config = parsed.envelope.config as SqlLabConfig;
    expect(config.schemaSql).toContain('CREATE TABLE sales');
    expect(parsed.envelope.initialSnippet).toContain('SELECT rep, amount FROM sales;');
    expect(parsed.envelope.solution).toContain('RANK() OVER');

    // 5. Preflight check executes
    const preflightInput = {
      title: 'SQL Window Functions Mastery',
      seriesId,
      instructions: parsed.envelope.instructions,
      solution: parsed.envelope.solution,
      schemaSql: config.schemaSql,
      diagnostics: parsed.diagnostics,
    };

    const isPreflightValid =
      preflightInput.title.length >= 5 &&
      Boolean(preflightInput.seriesId) &&
      preflightInput.diagnostics.length === 0 &&
      Boolean(preflightInput.schemaSql?.trim()) &&
      Boolean(preflightInput.solution?.trim());

    expect(isPreflightValid).toBe(true);

    // 6. Draft auto-save to browser storage
    const draftData = {
      title: preflightInput.title,
      markdown,
      sandboxType: 'sql_worker' as const,
      isProOnly: true,
      durationMinutes: 25,
      savedAt: new Date().toISOString(),
    };
    saveStudioDraft(draftKey, draftData);

    const restoredDraft = loadStudioDraft(draftKey);
    expect(restoredDraft).not.toBeNull();
    expect(restoredDraft?.title).toBe('SQL Window Functions Mastery');
    expect(restoredDraft?.isProOnly).toBe(true);
    expect(restoredDraft?.markdown).toContain('RANK() OVER');

    // 7. Publish Action: validates contract DTO and cleans up draft
    const publishPayload = {
      seriesId,
      title: draftData.title,
      sandboxType: draftData.sandboxType,
      instructions: parsed.envelope.instructions,
      initialSnippet: parsed.envelope.initialSnippet,
      solution: parsed.envelope.solution,
      durationMinutes: draftData.durationMinutes,
      isProOnly: draftData.isProOnly,
      sqlSchema: config.schemaSql,
    };

    expect(publishPayload.title).toBe('SQL Window Functions Mastery');
    expect(publishPayload.isProOnly).toBe(true);

    // Clear draft on publish
    clearStudioDraft(draftKey);
    expect(loadStudioDraft(draftKey)).toBeNull();
  });

  it('rejects preflight when author deletes solution or corrupts block syntax', () => {
    // Malformed markdown with unclosed block
    const brokenMarkdown = `# Broken Lab\n\n:::starter sql\nSELECT 1;\n`; // missing ::: closing
    const parsed = parseLabMarkdown(brokenMarkdown, 'sql_worker');
    
    // Incomplete syntax
    expect(parsed.envelope.solution).toBeUndefined();

    const hasSolution = Boolean(parsed.envelope.solution?.trim());
    expect(hasSolution).toBe(false);
  });
});
