import { Timestamp } from 'firebase/firestore';
import { ProductStatus } from './product-status.enum';

export interface StockInModel {
  No?: number;
  Date: Timestamp;
  Item?: string;
  categoryId?: string; // Display name Brand
  Brand?: string; // category name
  subcategoryId?: string;  // Display name Series
  Series?: string; // subcategory name
  Model?: string;
  Processor?: string;
  Genaration?: string;
  RAM?: string;
  ROM?: string;
  ProductID?: string;
  CostPrice?: number;
  AskingPrice?: number;
  Revenue?: number;
  NetRevenue?: number;
  // StockOutDate may be a user-entered string (YYYY-MM-DD) or a Firestore Timestamp after conversion
  StockOutDate?: Timestamp | string;
  SaleInvoiceNo?: string;
  Description?: string;
  Status?: ProductStatus;
  FeedBack?: string;
}
