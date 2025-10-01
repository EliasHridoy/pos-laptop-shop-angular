import { ProductStatus } from './product-status.enum';

export interface StockInModel {
  No?: number;
  Date?: string;
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
  SockOutDate?: string;
  SaleInvoiceNo?: string;
  Description?: string;
  Status?: ProductStatus;
}