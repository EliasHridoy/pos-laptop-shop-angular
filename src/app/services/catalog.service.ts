import { Injectable, inject } from '@angular/core';
import { NotificationService } from './notification.service';
import { Firestore, addDoc, collection, getDocs, orderBy, query, where } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private db = inject(Firestore);
  private notification = inject(NotificationService);

  async createCategory(name: string, parentId: string | null = null) {
    const payload = { name, nameLower: name.toLowerCase(), parentId: parentId || null, createdAt: Date.now() };
    try {
      const ref = await addDoc(collection(this.db, 'categories'), payload);
      this.notification.success('Category created successfully!');
      return ref.id;
    } catch (error: any) {
      this.notification.error('Failed to create category.');
      throw error;
    }
  }

  async listCategories(parentId: string | null = null) {
    const q = parentId
      ? query(collection(this.db, 'categories'), where('parentId', '==', parentId), orderBy('nameLower'))
      : query(collection(this.db, 'categories'), where('parentId', '==', null), orderBy('nameLower'));
    const snap = await getDocs(q);
    //log the query result
    console.log('listCategories result:', snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }
}
 
