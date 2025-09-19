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
        // Basic Information
        Date: p.Date || new Date(),
        Item: p.Item || '',
        name: p.Item || '', // For backward compatibility
        nameLower: (p.Item || '').toLowerCase(),
        
        // Category Information
        Brand: p.Brand || '',
        categoryId: p.categoryId || '',
        Series: p.Series || '',
        subcategoryId: p.subcategoryId || '',
        
        // Specifications
        Model: p.Model || '',
        Processor: p.Processor || '',
        Genaration: p.Genaration || '',
        RAM: p.RAM || '',
        ROM: p.ROM || '',
        
        // Stock Details
        stockQty: Number(p.stockQty || 0),
        CostPrice: Number(p.CostPrice || 0),
        
        // Generated Fields
        details: `${p.Processor || ''} ${p.Genaration || ''} ${p.RAM || ''} ${p.ROM || ''}`.trim(),
        keywords: [
          p.Item,
          ...(p.Brand ? p.Brand.split(' ') : []),
          p.Series,
          p.Model,
          p.Processor,
          p.Genaration,
          p.RAM,
          p.ROM
        ].filter((s): s is string => Boolean(s)).map(s => s.toLowerCase()),
        
        // Metadata
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
        // Basic Information
        Date: p.Date || new Date(),
        Item: p.Item || '',
        name: p.Item || '', // For backward compatibility
        nameLower: (p.Item || '').toLowerCase(),
        
        // Category Information
        Brand: p.Brand || '',
        categoryId: p.categoryId || '',
        Series: p.Series || '',
        subcategoryId: p.subcategoryId || '',
        
        // Specifications
        Model: p.Model || '',
        Processor: p.Processor || '',
        Genaration: p.Genaration || '',
        RAM: p.RAM || '',
        ROM: p.ROM || '',
        
        // Stock Details
        stockQty: Number(p.stockQty || 0),
        CostPrice: Number(p.CostPrice || 0),
        
        // Generated Fields
        details: `${p.Processor || ''} ${p.Genaration || ''} ${p.RAM || ''} ${p.ROM || ''}`.trim(),
        keywords: [
          p.Item,
          ...(p.Brand ? p.Brand.split(' ') : []),
          p.Series,
          p.Model,
          p.Processor,
          p.Genaration,
          p.RAM,
          p.ROM
        ].filter((s): s is string => Boolean(s)).map(s => s.toLowerCase()),
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

  // Search Product by Name (now searches by Item name)
  async searchByName(prefix: string) {
    const low = prefix.toLowerCase();
    // Search by both Item and nameLower for backwards compatibility
    const byItem = query(collection(this.db, 'products'), 
      orderBy('Item'), startAt(prefix), endAt(prefix + '\uf8ff'));
    const byName = query(collection(this.db, 'products'), 
      orderBy('nameLower'), startAt(low), endAt(low + '\uf8ff'));
    
    const [snapItem, snapName] = await Promise.all([
      getDocs(byItem),
      getDocs(byName)
    ]);

    // Combine and deduplicate results
    const results = new Map();
    [...snapItem.docs, ...snapName.docs].forEach(doc => {
      if (!results.has(doc.id)) {
        results.set(doc.id, { id: doc.id, ...(doc.data() as any) });
      }
    });

    return Array.from(results.values());
  }

  // Search Product by Keyword
  async searchByKeyword(token: string) {
    const t = token.toLowerCase();
    const q = query(collection(this.db, 'products'), where('keywords', 'array-contains', t));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }
}
