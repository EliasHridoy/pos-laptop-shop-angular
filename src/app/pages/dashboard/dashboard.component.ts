import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, Chart, registerables } from 'chart.js';
import { SalesService } from '../../services/sales.service';
import { ReportsService } from '../../services/reports.service';
import { PurchasesService } from '../../services/purchases.service';
import { Invoice } from '../../models/invoice.model';

interface SalesSummary {
  today: { value: number; count: number };
  yesterday: { value: number; count: number };
  last7Days: { value: number; count: number };
  last30Days: { value: number; count: number };
  total: { value: number; count: number };
}

interface ChartDataPoint {
  month: string;
  sales: number;
  stockIn: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styles: [`
    .dashboard-container {
      padding: 20px;
      background-color: #f8fafc;
      min-height: 100vh;
    }

    .dashboard-title {
      color: #0f766e;
      margin-bottom: 30px;
      font-size: 2rem;
      font-weight: 600;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      transition: transform 0.2s;
    }

    .card:hover {
      transform: translateY(-2px);
    }

    .card-title {
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .card-value {
      color: #0f766e;
      font-size: 1.875rem;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .card-count {
      color: #059669;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .chart-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .chart-section h2 {
      color: #0f766e;
      margin-bottom: 20px;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .chart-container {
      height: 400px;
    }

    .table-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .table-section h2 {
      color: #0f766e;
      margin-bottom: 20px;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .table-container {
      overflow-x: auto;
    }

    .sales-table {
      width: 100%;
      border-collapse: collapse;
    }

    .sales-table th,
    .sales-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .sales-table th {
      background-color: #f9fafb;
      color: #374151;
      font-weight: 600;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .sales-table td {
      color: #4b5563;
    }

    .view-btn {
      background-color: #0f766e;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .view-btn:hover {
      background-color: #115e59;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private salesService = inject(SalesService);
  private reportsService = inject(ReportsService);
  private purchasesService = inject(PurchasesService);

  summary: SalesSummary = {
    today: { value: 0, count: 0 },
    yesterday: { value: 0, count: 0 },
    last7Days: { value: 0, count: 0 },
    last30Days: { value: 0, count: 0 },
    total: { value: 0, count: 0 }
  };

  chartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Sales',
        borderColor: '#0f766e',
        backgroundColor: 'rgba(15, 118, 110, 0.1)',
        tension: 0.4
      },
      {
        data: [],
        label: 'Stock-in',
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        tension: 0.4
      }
    ]
  };

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Month'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Amount ($)'
        }
      }
    }
  };

  last10Sales: Invoice[] = [];
  isLoading = true;

  async ngOnInit() {
    // Register Chart.js components
    Chart.register(...registerables);

    await this.loadDashboardData();
  }

  private async loadDashboardData() {
    try {
      this.isLoading = true;

      // Load summary data
      await this.loadSummaryData();

      // Load chart data
      await this.loadChartData();

      // Load last 10 sales
      await this.loadLast10Sales();

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadSummaryData() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch last 30 days of sales for efficiency
    const recentSales = await this.reportsService.getSalesForDashboardSummary();

    // Calculate summary stats
    this.summary.today = this.calculatePeriodStats(recentSales, today, new Date());
    this.summary.yesterday = this.calculatePeriodStats(recentSales, yesterday, today);
    this.summary.last7Days = this.calculatePeriodStats(recentSales, sevenDaysAgo, new Date());
    this.summary.last30Days = this.calculatePeriodStats(recentSales, thirtyDaysAgo, new Date());

    // For total sales, we need all sales (this could be optimized with a counter collection)
    const allSales = await this.reportsService.getAllSalesSummary();
    this.summary.total = this.calculateTotalStats(allSales);
  }

  private async loadChartData() {
    // Fetch sales and purchases data for last 12 months
    const [salesData, purchasesData] = await Promise.all([
      this.reportsService.getSalesForChart(),
      this.reportsService.getPurchasesForChart()
    ]);

    console.log('Sales data fetched:', salesData.length, 'records');
    console.log('Purchases data fetched:', purchasesData.length, 'records');

    // Aggregate data by month
    const monthlyData = this.aggregateDataByMonth(salesData, purchasesData);

    console.log('Monthly aggregated data:', monthlyData);

    // Update chart data
    this.chartData.labels = monthlyData.map(d => d.month);
    this.chartData.datasets[0].data = monthlyData.map(d => d.sales);
    this.chartData.datasets[1].data = monthlyData.map(d => d.stockIn);
  }

  private async loadLast10Sales() {
    this.last10Sales = await this.reportsService.getLast10Sales();
  }

  private calculatePeriodStats(sales: any[], startDate: Date, endDate: Date): { value: number; count: number } {
    const periodSales = sales.filter(sale => {
      const saleDate = sale.createdAt?.toDate();
      return saleDate && saleDate >= startDate && saleDate < endDate;
    });

    const value = periodSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const count = periodSales.length;

    return { value, count };
  }

  private calculateTotalStats(sales: any[]): { value: number; count: number } {
    const value = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const count = sales.length;
    return { value, count };
  }

  private aggregateDataByMonth(salesData: any[], purchasesData: any[]): ChartDataPoint[] {
    const monthlyMap = new Map<string, { sales: number; stockIn: number }>();

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      monthlyMap.set(monthKey, { sales: 0, stockIn: 0 });
    }

    // Aggregate sales data
    salesData.forEach(sale => {
      const date = sale.createdAt?.toDate();
      if (date) {
        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (monthlyMap.has(monthKey)) {
          const current = monthlyMap.get(monthKey)!;
          current.sales += sale.total || 0;
        }
      }
    });

    console.log('Sales aggregated by month:', Array.from(monthlyMap.entries()).map(([month, data]) => ({ month, sales: data.sales })));

    // Aggregate purchases/stock-in data
    purchasesData.forEach(purchase => {
      const date = purchase.Date?.toDate();
      if (date) {
        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (monthlyMap.has(monthKey)) {
          const current = monthlyMap.get(monthKey)!;
          current.stockIn += purchase.CostPrice || 0;
        }
      }
    });

    console.log('Purchases aggregated by month:', Array.from(monthlyMap.entries()).map(([month, data]) => ({ month, stockIn: data.stockIn })));

    return Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      sales: data.sales,
      stockIn: data.stockIn
    }));
  }
}
