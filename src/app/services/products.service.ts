import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, doc, getDoc, getDocs, updateDoc, deleteDoc, 
         orderBy, query, runTransaction, where, startAt, endAt, serverTimestamp } from '@angular/fire/firestore';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private db = inject(Firestore);
  private notification = inject(NotificationService);

  // Create Product
  async createProduct(p: any) {
    try {
      const ref = await addDoc(collection(this.db, 'products'), {
        sku: p.sku || '',
        name: p.name,
        nameLower: p.name.toLowerCase(),
        brand: p.brand || '',
        categoryId: p.categoryId || null,
        subcategoryId: p.subcategoryId || null,
        costPrice: Number(p.costPrice || 0),
        defaultSellPrice: Number(p.defaultSellPrice || 0),
        stockQty: Number(p.stockQty || 0),
        details: p.details || '',
        keywords: (p.name + ' ' + (p.details || '')).toLowerCase().split(/\s+/).filter(Boolean),
        createdAt: serverTimestamp()
      });
      this.notification.success('Product added!');
    } catch (e: any) {
      this.notification.error('Failed to add product.');
      throw e;
    }
  }

  // Update Product
  async updateProduct(id: string, p: any) {
    try {
      const ref = doc(this.db, 'products', id);
      await updateDoc(ref, {
        sku: p.sku || '',
        name: p.name,
        nameLower: p.name.toLowerCase(),
        brand: p.brand || '',
        categoryId: p.categoryId || null,
        subcategoryId: p.subcategoryId || null,
        costPrice: Number(p.costPrice || 0),
        defaultSellPrice: Number(p.defaultSellPrice || 0),
        stockQty: Number(p.stockQty || 0),
        details: p.details || '',
        keywords: (p.name + ' ' + (p.details || '')).toLowerCase().split(/\s+/).filter(Boolean),
      });
      this.notification.success('Product updated!');
    } catch (e: any) {
      this.notification.error('Failed to update product.');
      throw e;
    }
  }

  // Delete Product
  async deleteProduct(id: string) {
    try {
      await deleteDoc(doc(this.db, 'products', id));
      this.notification.success('Product deleted!');
    } catch (e: any) {
      this.notification.error('Failed to delete product.');
      throw e;
    }
  }

  // Search Product by Name
  async searchByName(prefix: string) {
    const low = prefix.toLowerCase();
    const q = query(collection(this.db, 'products'), orderBy('nameLower'), startAt(low), endAt(low + '\uf8ff'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }

  // Search Product by Keyword
  async searchByKeyword(token: string) {
    const t = token.toLowerCase();
    const q = query(collection(this.db, 'products'), where('keywords', 'array-contains', t));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }
}
