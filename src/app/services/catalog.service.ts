import { Injectable, inject } from '@angular/core';
import { NotificationService } from './notification.service';
import { Firestore, addDoc, collection, getDocs, orderBy, query, where, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';

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

  async updateCategory(id: string, data: { name: string, parentId: string | null }) {
    const payload = { name: data.name, nameLower: data.name.toLowerCase(), parentId: data.parentId || null };
    try {
      await updateDoc(doc(this.db, 'categories', id), payload);
      this.notification.success('Category updated successfully!');
    } catch (error: any) {
      this.notification.error('Failed to update category.');
      throw error;
    }
  }

  async deleteCategory(id: string) {
    const subcategories = await this.listSubcategories(id);
    if (subcategories.length > 0) {
      this.notification.error('Cannot delete a category that has subcategories.');
      throw new Error('Cannot delete a category that has subcategories.');
    }

    try {
      await deleteDoc(doc(this.db, 'categories', id));
      this.notification.success('Category deleted successfully!');
    } catch (error: any) {
      this.notification.error('Failed to delete category.');
      throw error;
    }
  }

  async listCategories() {
    const q = query(collection(this.db, 'categories'), orderBy('nameLower'));
    const snap = await getDocs(q);
    const categories = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    return categories.map(c => ({
        ...c,
        parentName: c.parentId ? categoryMap.get(c.parentId) : ''
    }));
  }

  async listParentCategories() {
    const q = query(collection(this.db, 'categories'), where('parentId', '==', null), orderBy('nameLower'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }

  async listSubcategories(parentId: string | null = null) {
    const q = parentId
      ? query(collection(this.db, 'categories'), where('parentId', '==', parentId), orderBy('nameLower'))
      : query(collection(this.db, 'categories'), where('parentId', '==', null), orderBy('nameLower'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }
}
 
