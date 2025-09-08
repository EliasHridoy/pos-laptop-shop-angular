import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, query } from '@angular/fire/firestore';

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
}
 
