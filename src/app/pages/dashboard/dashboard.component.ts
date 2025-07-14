import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { NgFor, NgIf } from '@angular/common';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  loadingStatistics = true;
  statistics: any = null;

  loadingLogs = true;
  maintenanceLogs: any[] = [];
  maintenanceMeta: any = null;
  allMaintenanceLogs: any[] = [];

  // Pagination, search, and sorting state
  currentPage = 1;
  pageSize = 5;
  searchTerm = '';
  sortField: string = 'service_date';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.loadMaintenanceLogs();
      this.loadingStatistics = true;
      this.dashboardService.getStatistics(token).subscribe({
        next: (stats) => {
          console.log('Dashboard Statistics:', stats);
          this.statistics = stats;
          this.loadingStatistics = false;
        },
        error: (err) => {
          console.error('Failed to fetch dashboard statistics:', err);
          this.loadingStatistics = false;
        },
      });
    } else {
      console.warn('No token found in localStorage.');
      this.loadingStatistics = false;
      this.loadingLogs = false;
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
        'desc', // always fetch from backend in desc order, sort locally if needed
        'service_date',
        this.currentPage,
        '' // no backend search
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
