import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, doc, getDoc, getDocs, updateDoc, deleteDoc, 
         orderBy, query, runTransaction, where, startAt, endAt, serverTimestamp, writeBatch } from '@angular/fire/firestore';
import { NotificationService } from './notification.service';
import { ProductStatus } from '../models/product-status.enum';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private db = inject(Firestore);
  private notification = inject(NotificationService);

  // Helper function to generate consistent product description
  private generateProductDescription(p: any): string {
    let descriptionText = '';
    if (p.Brand) descriptionText += `${p.Brand} `;
    if (p.Model) descriptionText += `${p.Model}\n`;
    if (p.Series) descriptionText += `${p.Series}\n`;
    if (p.Processor) descriptionText += `${p.Processor} ${p.Genaration || ''}\n`;
    if (p.RAM || p.ROM) descriptionText += `${p.RAM || ''} ${p.ROM || ''}\n`;
    if (p.Description) descriptionText += p.Description;
    return descriptionText.trim();
  }

  // Create Product
  async createProduct(p: any) {
    try {
      const ref = await addDoc(collection(this.db, 'products'), {
        // Basic Information
        No: p.No ? Number(p.No) : null,
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
        
        // Product Details
        ProductID: p.ProductID || '',
        CostPrice: Number(p.CostPrice || 0),
        Description: p.Description || '',
        Status: p.Status || 'Available',
        
        // Generated Fields
        details: this.generateProductDescription(p),
        keywords: [
          p.Item,
          ...(p.Brand ? p.Brand.split(' ') : []),
          p.Series,
          p.Model,
          p.Processor,
          p.Genaration,
          p.RAM,
          p.ROM,
          p.ProductID
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

  // Batch Create Products
  async addProductsBatch(products: any[]) {
    const batch = writeBatch(this.db);
    // Keep track of created document refs so caller can use their ids
    const newDocRefs = products.map(() => doc(collection(this.db, 'products')));
    products.forEach((p, idx) => {
      const newDocRef = newDocRefs[idx];
      batch.set(newDocRef, {
        No: p.No ? Number(p.No) : null,
        Date: p.Date || new Date(),
        Item: p.Item || '',
        name: p.Item || '',
        nameLower: (p.Item || '').toLowerCase(),
        Brand: p.Brand || '',
        categoryId: p.categoryId || '',
        Series: p.Series || '',
        subcategoryId: p.subcategoryId || '',
        Model: p.Model || '',
        Processor: p.Processor || '',
        Genaration: p.Genaration || '',
        RAM: p.RAM || '',
        ROM: p.ROM || '',
        ProductID: p.ProductID || '',
        CostPrice: Number(p.CostPrice || 0),
        Description: p.Description || '',
        Status: p.Status || 'Available',
        details: this.generateProductDescription(p),
        keywords: [
          p.Item,
          ...(p.Brand ? p.Brand.split(' ') : []),
          p.Series,
          p.Model,
          p.Processor,
          p.Genaration,
          p.RAM,
          p.ROM,
          p.ProductID
        ].filter((s): s is string => Boolean(s)).map(s => s.toLowerCase()),
        createdAt: serverTimestamp()
      });
    });

    try {
      await batch.commit();
      this.notification.success(`${products.length} products added successfully!`);
      // Return created ids to caller
      return newDocRefs.map(r => r.id);
    } catch (e) {
      this.notification.error('Failed to add products in batch.');
      throw e;
    }
  }

  // Update Product
  async updateProduct(id: string, p: any) {
    try {
      const ref = doc(this.db, 'products', id);
      await updateDoc(ref, {
        // Basic Information
        No: p.No ? Number(p.No) : null,
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
        
        // Product Details
        ProductID: p.ProductID || '',
        CostPrice: Number(p.CostPrice || 0),
        Description: p.Description || '',
        Status: p.Status || 'Available',
        
        // Generated Fields
        details: this.generateProductDescription(p),
        keywords: [
          p.Item,
          ...(p.Brand ? p.Brand.split(' ') : []),
          p.Series,
          p.Model,
          p.Processor,
          p.Genaration,
          p.RAM,
          p.ROM,
          p.ProductID
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
  async searchByName(prefix: string, onlyAvailable = false) {
    const low = prefix.toLowerCase();
    // Search by both Item and nameLower for backwards compatibility
    const constraints: any[] = [];
    if (onlyAvailable) {
      constraints.push(where('Status', '==', 'Available'));
    }

    const byItem = query(collection(this.db, 'products'), 
      ...constraints,
      orderBy('Item'), startAt(prefix), endAt(prefix + '\uf8ff'));
    const byName = query(collection(this.db, 'products'), 
      ...constraints,
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
  async searchByKeyword(token: string, onlyAvailable = false) {
    const t = token.toLowerCase();
    const constraints: any[] = [where('keywords', 'array-contains', t)];
    if (onlyAvailable) {
      constraints.push(where('Status', '==', 'Available'));
    }
    const q = query(collection(this.db, 'products'), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }

  // Get Product by ID
  async getProduct(id: string) {
    try {
      const docRef = doc(this.db, 'products', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...(docSnap.data() as any) };
      } else {
        this.notification.error('Product not found.');
        return null;
      }
    } catch (e: any) {
      this.notification.error('Failed to get product.');
      throw e;
    }
  }

  // Get Products by Status
  async getProductsByStatus(status: ProductStatus | null = null) {
    try {
      let q;
      if (status) {
        q = query(
          collection(this.db, 'products'),
          where('Status', '==', status),
          orderBy('Date', 'desc')
        );
      } else {
        q = query(
          collection(this.db, 'products'),
          orderBy('Date', 'desc')
        );
      }
      
      const snap = await getDocs(q);
      const products = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      
      // Calculate total cost
      const totalCost = products.reduce((sum, product) => sum + (Number(product.CostPrice) || 0), 0);
      
      return {
        products,
        totalCost,
        count: products.length
      };
    } catch (e: any) {
      this.notification.error('Failed to fetch products.');
      throw e;
    }
  }
}
