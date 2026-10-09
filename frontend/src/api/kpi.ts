import client from './client';
import type { KPISummary } from '../types';

export const fetchKPISummary = (): Promise<KPISummary> =>
  client.get('/api/kpi/summary').then((r) => r.data);
