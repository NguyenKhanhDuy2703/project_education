import type { LabSeries } from '@/types/lab.types';

export interface FormatBadgeInfo {
  label: string;
  shortLabel: string;
  badgeClass: string;
}

export function getFormatInfo(format?: string): FormatBadgeInfo {
  switch (format) {
    case 'sql_worker':
      return {
        label: 'SQL Query',
        shortLabel: 'SQL',
        badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
      };
    case 'quizlet':
      return {
        label: 'Quiz & Thinking',
        shortLabel: 'Quizlet',
        badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
      };
    case 'hybrid':
      return {
        label: 'Auto Test & Quiz',
        shortLabel: 'Auto & Quiz',
        badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
      };
    case 'js_worker':
    default:
      return {
        label: 'Automation Test',
        shortLabel: 'Auto Test',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      };
  }
}

export function getSeriesFormat(series: LabSeries): string {
  if (series.formatType) return series.formatType;
  if (series.labs && series.labs.length > 0) {
    const hasSql = series.labs.some((l) => l.sandboxType === 'sql_worker');
    const hasQuiz = series.labs.some((l) => l.sandboxType === 'quizlet');
    const hasJs = series.labs.some((l) => l.sandboxType === 'js_worker');
    if (hasSql && !hasQuiz && !hasJs) return 'sql_worker';
    if (hasQuiz && !hasSql && !hasJs) return 'quizlet';
    if (hasJs && !hasSql && !hasQuiz) return 'js_worker';
    if (hasQuiz && hasJs && !hasSql) return 'hybrid';
    if (hasSql) return 'sql_worker';
    if (series.slug.includes('automation') || series.slug.includes('test')) return 'js_worker';
    if (hasQuiz) return 'quizlet';
    return 'js_worker';
  }
  const cat = (series.category || series.topic || '').toLowerCase();
  if (cat === 'database' || series.slug.includes('sql')) return 'sql_worker';
  if (series.slug.includes('quiz')) return 'quizlet';
  if (series.slug.includes('automation') || cat === 'testing') return 'js_worker';
  return 'js_worker';
}
