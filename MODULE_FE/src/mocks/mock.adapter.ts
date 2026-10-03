/**
 * Mock Adapter
 *
 * Khi VITE_USE_MOCK=true, tất cả API call được thay bằng JSON tĩnh.
 * Khi VITE_USE_MOCK=false (production), gọi API thật.
 *
 * Dùng: thêm VITE_USE_MOCK=true vào .env.local
 */
import type { LabSeries, LabDetail, DashboardStats } from '@/types/lab.types';

import seriesListData from './data/series.mock.json';
import seriesDetailData from './data/series-detail.mock.json';
import labsData from './data/labs.mock.json';
import dashboardStatsData from './data/dashboard-stats.mock.json';

const MOCK_DELAY_MS = 400; // giả lập latency mạng

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const isMock = import.meta.env.VITE_USE_MOCK === 'true';

// ─── Series ───────────────────────────────────────────────────────────────────

export async function mockGetAllSeries(): Promise<LabSeries[]> {
  await delay(MOCK_DELAY_MS);
  return seriesListData as LabSeries[];
}

export async function mockGetSeriesBySlug(slug: string): Promise<LabSeries> {
  await delay(MOCK_DELAY_MS);
  const detail = (seriesDetailData as Record<string, LabSeries>)[slug];
  if (!detail) throw new Error(`[Mock] Series not found: ${slug}`);
  return detail;
}

// ─── Lab ─────────────────────────────────────────────────────────────────────

export async function mockGetLabById(labId: string): Promise<LabDetail> {
  await delay(MOCK_DELAY_MS);
  const lab = (labsData as Record<string, LabDetail>)[labId];
  if (!lab) throw new Error(`[Mock] Lab not found: ${labId}`);
  return lab;
}

export async function mockSubmitLab(_labId: string): Promise<void> {
  await delay(MOCK_DELAY_MS);
  // no-op in mock mode
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function mockGetDashboardStats(): Promise<DashboardStats> {
  await delay(MOCK_DELAY_MS);
  return dashboardStatsData as DashboardStats;
}
