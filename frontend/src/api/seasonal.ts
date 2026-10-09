import client from './client';
import type { SeasonalMonthlyTrend, PeakMonth, YoYComparison, HeatmapCell } from '../types';

export const fetchMonthlyTrend = (year = 2024): Promise<SeasonalMonthlyTrend[]> =>
  client.get('/api/seasonal/monthly-trend', { params: { year } }).then((r) => r.data);

export const fetchPeakMonths = (year = 2024): Promise<PeakMonth[]> =>
  client.get('/api/seasonal/peak-months', { params: { year } }).then((r) => r.data);

export const fetchYoYComparison = (): Promise<YoYComparison[]> =>
  client.get('/api/seasonal/yoy-comparison').then((r) => r.data);

export const fetchHeatmap = (year = 2024): Promise<HeatmapCell[]> =>
  client.get('/api/seasonal/heatmap', { params: { year } }).then((r) => r.data);
