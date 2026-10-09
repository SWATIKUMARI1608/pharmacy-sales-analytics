import client from './client';
import type { CategoryRevenue, CategoryMonthly, CategoryGrowth } from '../types';

export const fetchCategoryRevenueShare = (year = 2024): Promise<CategoryRevenue[]> =>
  client.get('/api/categories/revenue-share', { params: { year } }).then((r) => r.data);

export const fetchCategoryMonthly = (year = 2024): Promise<CategoryMonthly[]> =>
  client.get('/api/categories/monthly', { params: { year } }).then((r) => r.data);

export const fetchCategoryGrowth = (year = 2024): Promise<CategoryGrowth[]> =>
  client.get('/api/categories/growth', { params: { year } }).then((r) => r.data);
