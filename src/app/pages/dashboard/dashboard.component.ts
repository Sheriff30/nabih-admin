import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { NgFor, NgIf } from '@angular/common';
import { DatePipe } from '@angular/common';
import { NgClass } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { ViewChild } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { FormsModule } from '@angular/forms';
import { PermissionsService } from '../../services/permissions-store.service';
import { Subscription } from 'rxjs';
import { AccessDeniedComponent } from '../access-denied/access-denied.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    DatePipe,
    NgClass,
    NgChartsModule,
    FormsModule,
    AccessDeniedComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  loadingStatistics = true;
  statistics: any = null;

  loadingLogs = true;
  maintenanceLogs: any[] = [];
  maintenanceMeta: any = null;
  allMaintenanceLogs: any[] = [];

  loadingMonthlyMaintenance = true;

  // Pagination, search, and sorting state
  currentPage = 1;
  pageSize = 5;
  searchTerm = '';
  sortField: string = 'service_date';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Chart.js for monthly maintenance
  monthlyMaintenanceLabels: string[] = [];
  monthlyMaintenanceData: number[] = [];
  monthlyMaintenanceChart: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          label: 'Maintenance operations',
          fill: true,
          tension: 0.4,
          borderColor: '#7F5EA3',
          backgroundColor: 'rgba(127,94,163,0.1)',
          pointBackgroundColor: '#fff',
          pointBorderColor: '#7F5EA3',
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: any) =>
              `${context.parsed.y} Maintenance operations`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { display: false },
          border: { display: false },
        },
        x: {
          grid: { display: false },
          border: { display: false },
        },
      },
    },
  };

  // Add month range selector
  monthRanges = [12, 9, 6, 3];
  selectedMonthRange = 12;
  allMonthlyMaintenanceData: any[] = [];

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  permissionsLoading = true;
  private permissionsSub: Subscription | undefined;

  updateMonthlyMaintenanceChart(data: any[]) {
    // Store all data for filtering
    this.allMonthlyMaintenanceData = data;
    this.applyMonthRangeFilter();
  }

  applyMonthRangeFilter() {
    // Get the last N months based on selectedMonthRange
    const filtered = this.allMonthlyMaintenanceData.slice(
      -this.selectedMonthRange
    );
    this.monthlyMaintenanceLabels = filtered.map((item) => item.month_name);
    this.monthlyMaintenanceData = filtered.map((item) => item.count);
    this.monthlyMaintenanceChart.data.labels = this.monthlyMaintenanceLabels;
    this.monthlyMaintenanceChart.data.datasets = [
      {
        data: this.monthlyMaintenanceData,
        label: 'Maintenance operations',
        fill: true,
        tension: 0.4,
        borderColor: '#7F5EA3',
        backgroundColor: 'rgba(127,94,163,0.1)',
        pointBackgroundColor: '#fff',
        pointBorderColor: '#7F5EA3',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ];
    setTimeout(() => {
      this.chart?.update();
    }, 0);
  }

  onMonthRangeChange(range: number) {
    this.selectedMonthRange = range;
    this.applyMonthRangeFilter();
  }

  constructor(
    private dashboardService: DashboardService,
    public permissionsStore: PermissionsService
  ) {}

  ngOnInit(): void {
    this.permissionsSub = this.permissionsStore.permissions$.subscribe(
      (permissions) => {
        if (permissions && permissions.length > 0) {
          this.permissionsLoading = false;
        }
      }
    );
    const token = localStorage.getItem('token');
    if (token) {
      this.loadMaintenanceLogs();
      this.loadingStatistics = true;
      this.dashboardService.getStatistics(token).subscribe({
        next: (stats) => {
          this.statistics = stats;
          this.loadingStatistics = false;
        },
        error: (err) => {
          console.error('Failed to fetch dashboard statistics:', err);
          this.loadingStatistics = false;
        },
      });
      // Fetch monthly maintenance data for chart
      this.loadingMonthlyMaintenance = true;
      this.dashboardService.getMonthlyMaintenanceCount(token).subscribe({
        next: (res) => {
          if (res.success && Array.isArray(res.data)) {
            this.updateMonthlyMaintenanceChart(res.data);
          }
          this.loadingMonthlyMaintenance = false;
        },
        error: (err) => {
          console.error('Failed to fetch monthly maintenance counts:', err);
          this.loadingMonthlyMaintenance = false;
        },
      });
    } else {
      console.warn('No token found in localStorage.');
      this.loadingStatistics = false;
      this.loadingLogs = false;
      this.loadingMonthlyMaintenance = false;
    }
  }

  ngOnDestroy(): void {
    if (this.permissionsSub) {
      this.permissionsSub.unsubscribe();
    }
  }

  loadMaintenanceLogs() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.loadingLogs = false;
      return;
    }
    this.loadingLogs = true;
    this.dashboardService
      .getMaintenanceLogs(
        token,
        this.pageSize.toString(),
        'desc',
        'service_date',
        this.currentPage,
        ''
      )
      .subscribe({
        next: (logs) => {
          this.allMaintenanceLogs = logs?.data?.maintenance_logs ?? [];
          this.maintenanceMeta = logs?.data?.meta ?? null;
          this.applyFilters();
          this.loadingLogs = false;
        },
        error: (err) => {
          console.error('Failed to fetch maintenance logs:', err);
          this.loadingLogs = false;
        },
      });
  }

  applyFilters() {
    let filtered = [...this.allMaintenanceLogs];
    // Search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.vehicle_name?.toLowerCase().includes(term) ||
          log.service_type?.toLowerCase().includes(term) ||
          log.next_service_type?.toLowerCase().includes(term)
      );
    }
    // Sort
    filtered.sort((a, b) => {
      let aValue = a[this.sortField];
      let bValue = b[this.sortField];
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';
      if (this.sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
    // No pagination here, since backend paginates
    this.maintenanceLogs = filtered;
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.applyFilters();
  }

  onPageChange(page: number) {
    if (page !== this.currentPage) {
      this.currentPage = page;
      this.loadMaintenanceLogs();
    }
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadMaintenanceLogs();
  }

  onSort(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }
}
