import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  WorkshopService,
  WorkshopServiceResource,
} from '../../services/workshop.service';

@Component({
  selector: 'app-workshop',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './workshop.component.html',
  styleUrl: './workshop.component.css',
})
export class WorkshopComponent implements OnInit {
  public workshops: WorkshopServiceResource[] = [];

  // Search, sort, and pagination state
  public searchTerm: string = '';
  public sortColumn: string = '';
  public sortDirection: 'asc' | 'desc' = 'asc';
  public currentPage: number = 1;
  public perPage: number = 10;
  public Math = Math;
  public loading: boolean = false;

  constructor(private workshopService: WorkshopService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found in localStorage.');
      return;
    }
    this.loading = true;
    this.workshopService.getWorkshops(token).subscribe({
      next: (res) => {
        this.workshops = res.data.workshops;
        this.loading = false;
        console.log(this.workshops);
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to fetch workshops:', err);
      },
    });
  }

  get filteredAndSortedWorkshops(): WorkshopServiceResource[] {
    let filtered = this.workshops;
    // Search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.name.toLowerCase().includes(term) ||
          w.city?.toLowerCase().includes(term) ||
          w.address?.toLowerCase().includes(term) ||
          w.services.some((s) => s.name.toLowerCase().includes(term))
      );
    }
    // Sort
    if (this.sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = a[this.sortColumn as keyof WorkshopServiceResource];
        let bValue: any = b[this.sortColumn as keyof WorkshopServiceResource];
        // Special case for services (sort by first service name)
        if (this.sortColumn === 'services') {
          aValue = a.services[0]?.name || '';
          bValue = b.services[0]?.name || '';
        }
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    // Pagination
    const start = (this.currentPage - 1) * this.perPage;
    const end = start + this.perPage;
    return filtered.slice(start, end);
  }

  get totalFiltered(): number {
    let filtered = this.workshops;
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.name.toLowerCase().includes(term) ||
          w.city?.toLowerCase().includes(term) ||
          w.address?.toLowerCase().includes(term) ||
          w.services.some((s) => s.name.toLowerCase().includes(term))
      );
    }
    return filtered.length;
  }

  onSearch(term: string) {
    this.searchTerm = typeof term === 'string' ? term : '';
    this.currentPage = 1;
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onPerPageChange(newPerPage: number) {
    const value =
      typeof newPerPage === 'string' ? parseInt(newPerPage, 10) : newPerPage;
    this.perPage = value;
    this.currentPage = 1;
  }

  get totalPages(): number {
    return Math.ceil(this.totalFiltered / this.perPage) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
