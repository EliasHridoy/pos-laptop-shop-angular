import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { CategoriesComponent } from './pages/catalog/categories.component';
import { ProductsComponent } from './pages/catalog/products.component';
import { SalesNewComponent } from './pages/sales/sales-new.component';
import { SalesListComponent } from './pages/sales/sales-list.component';
import { InvoiceComponent } from './pages/sales/invoice.component';
import { ReturnsComponent } from './pages/returns/returns.component';
import { ServiceOrdersComponent } from './pages/services/service-orders.component';
import { SalesReportComponent } from './pages/reports/sales-report.component';
import { PurchaseReportComponent } from './pages/reports/purchase-report.component';
import { ProfitLossReportComponent } from './pages/reports/profit-loss-report.component';
import { PurchasesComponent } from './pages/purchases/purchases.component';
import { AdminInvitesComponent } from './pages/admin/admin-invites.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'catalog/categories', component: CategoriesComponent },
      { path: 'catalog/products', component: ProductsComponent },
      { path: 'purchases', component: PurchasesComponent },
      { path: 'sales/new', component: SalesNewComponent },
      { path: 'sales', component: SalesListComponent },
      { path: 'sales/invoice/:id', component: InvoiceComponent },
      { path: 'returns', component: ReturnsComponent },
      { path: 'services', component: ServiceOrdersComponent },
      { path: 'reports/sales', component: SalesReportComponent },
      { path: 'reports/purchases', component: PurchaseReportComponent },
      { path: 'reports/profit', component: ProfitLossReportComponent },
      { path: 'admin/invites', component: AdminInvitesComponent, canActivate: [AdminGuard] }
    ]
  },
  { path: '**', redirectTo: '' }
];
 
