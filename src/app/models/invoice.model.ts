import { Timestamp } from '@angular/fire/firestore';

export interface Customer {
  name: string;
  phone?: string;
  address?: string;
  email?: string;
}

export interface InvoiceItem {
  productId: string;
  productSerialNumber?: string;
  name: string;
  serialNumber?: string;
  description?: string;
  qty: number;
  sellPrice: number;
  costPrice: number;
  stockOutDate: Timestamp;
}

export interface SoldBy {
  uid: string;
  displayName: string | null;
  email: string | null;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  customer: Customer | null;
  items: InvoiceItem[];
  subTotal: number;
  discount: number;
  total: number;
  paid: number;
  costTotal: number;
  profit: number;
  type: 'DIRECT' | 'INSTANT';
  status: 'COMPLETED' | 'CANCELLED';
  note?: string;
  soldBy: SoldBy | null;
  createdAt: Timestamp;
}
