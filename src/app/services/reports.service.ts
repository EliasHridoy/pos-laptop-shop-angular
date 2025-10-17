import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, query, where, orderBy, limit } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private db = inject(Firestore);

  async salesBetween(fromISO: string, toISO: string) {
    const q = query(collection(this.db, 'sales'));
    const snap = await getDocs(q);
    const from = new Date(fromISO).getTime();
    const to = new Date(toISO).getTime();
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
      .filter(x => x.createdAt?.toMillis ? (x.createdAt.toMillis() >= from && x.createdAt.toMillis() <= to) : true);
  }

  async purchasesBetween(fromISO: string, toISO: string) {
    const q = query(collection(this.db, 'purchases'));
    const snap = await getDocs(q);
    const from = new Date(fromISO).getTime();
    const to = new Date(toISO).getTime();
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
      .filter(x => x.createdAt?.toMillis ? (x.createdAt.toMillis() >= from && x.createdAt.toMillis() <= to) : true);
  }

  // Optimized method for dashboard summary - fetches last 30 days of sales
  async getSalesForDashboardSummary() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const q = query(
      collection(this.db, 'sales'),
      where('createdAt', '>=', thirtyDaysAgo),
      orderBy('createdAt', 'desc')
    );

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }

  // Get all sales for total calculation (optimized - could be cached)
  async getAllSalesSummary() {
    const q = query(collection(this.db, 'sales'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }

  // Get last 10 sales for dashboard
  async getLast10Sales() {
    const q = query(
      collection(this.db, 'sales'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }

  // Get sales data for last 12 months (aggregated by month)
  async getSalesForChart() {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const q = query(
      collection(this.db, 'sales'),
      where('createdAt', '>=', twelveMonthsAgo),
      orderBy('createdAt', 'asc')
    );

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }

  // Get purchases/stock-in data for last 12 months
  async getPurchasesForChart() {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const q = query(
      collection(this.db, 'purchases'),
      where('createdAt', '>=', twelveMonthsAgo),
      orderBy('createdAt', 'asc')
    );

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }
}
