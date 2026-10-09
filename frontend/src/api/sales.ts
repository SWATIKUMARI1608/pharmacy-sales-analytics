import client from './client';
import type { SalesOverTime, TopMedicine, SalesByType, MedicineDetail } from '../types';

export const fetchSalesOverTime = (year = 2024): Promise<SalesOverTime[]> =>
  client.get('/api/sales/over-time', { params: { year } }).then((r) => r.data);

export const fetchTopMedicines = (
  limit = 10,
  startDate?: string,
  endDate?: string,
): Promise<TopMedicine[]> =>
  client
    .get('/api/sales/top-medicines', { params: { limit, start_date: startDate, end_date: endDate } })
    .then((r) => r.data);

export const fetchSalesByType = (year = 2024): Promise<SalesByType> =>
  client.get('/api/sales/by-type', { params: { year } }).then((r) => r.data);

export const fetchMedicinesDetail = (params: {
  start_date?: string;
  end_date?: string;
  sale_type?: string;
}): Promise<MedicineDetail[]> =>
  client.get('/api/sales/medicines', { params }).then((r) => r.data);
