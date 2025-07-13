import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SupportRequestsService,
  SupportRequestsResponse,
} from '../../services/support-requests.service';

@Component({
  selector: 'app-support-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support-requests.component.html',
  styleUrl: './support-requests.component.css',
})
export class SupportRequestsComponent implements OnInit {
  allSupportRequests: any[] = [];
  supportRequests: any[] = [];
  loading = false;
  error: string | null = null;

  // Search, sort, and pagination state
  searchTerm: string = '';
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage: number = 1;
  pageSize: number = 10;

  // Modal and tab state
  showModal = false;
  selectedRequest: any = null;
  activeTab: 'details' | 'admin' = 'details';
  adminResponse: string = '';
  adminStatus: 'pending' | 'open' | 'closed' = 'pending';
  submitting = false;
  formError: string | null = null;

  constructor(private supportRequestsService: SupportRequestsService) {}

  ngOnInit(): void {
    this.loadSupportRequests();
  }

  loadSupportRequests(): void {
    this.loading = true;
    this.error = null;

    // Get token from localStorage
    const token = localStorage.getItem('token');

    if (!token) {
      this.error = 'No authentication token found';
      this.loading = false;
      return;
    }

    // Fetch support requests
    this.supportRequestsService.listSupportRequests(token, 1, 1000).subscribe({
      next: (response: SupportRequestsResponse) => {
        console.log(response);
        this.allSupportRequests = response.data.support_requests;
        this.applyFilters();
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load support requests';
        this.loading = false;
      },
    });
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.currentPage = 1;
    this.applyFilters();
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

  onPageChange(page: number) {
    this.currentPage = page;
    this.applyFilters();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.applyFilters();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAndSortedRequests.length / this.pageSize);
  }

  get filteredAndSortedRequests(): any[] {
    // Search
    let filtered = this.allSupportRequests.filter((req) => {
      const term = this.searchTerm.toLowerCase();
      return (
        req.request_id?.toLowerCase().includes(term) ||
        req.subject?.toLowerCase().includes(term) ||
        req.issue_type?.toLowerCase().includes(term)
      );
    });
    // Sort
    if (this.sortField) {
      filtered = filtered.slice().sort((a, b) => {
        let aValue = a[this.sortField];
        let bValue = b[this.sortField];
        // For nested fields
        if (this.sortField.startsWith('user.')) {
          const key = this.sortField.split('.')[1];
          aValue = a.user ? a.user[key] : '';
          bValue = b.user ? b.user[key] : '';
        }
        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }

  applyFilters() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.supportRequests = this.filteredAndSortedRequests.slice(start, end);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  openModal(request: any) {
    this.selectedRequest = request;
    this.showModal = true;
    this.activeTab = 'details';
    this.adminResponse = request.admin_response || '';
    this.adminStatus = request.status;
    this.formError = null;
  }

  closeModal() {
    this.showModal = false;
    this.selectedRequest = null;
    this.formError = null;
  }

  setTab(tab: 'details' | 'admin') {
    this.activeTab = tab;
  }

  submitAdminResponse() {
    if (!this.selectedRequest) return;
    if (!this.adminResponse.trim()) {
      this.formError = 'Response is required.';
      return;
    }
    this.submitting = true;
    this.formError = null;
    const token = localStorage.getItem('token');
    if (!token) {
      this.formError = 'No authentication token found';
      this.submitting = false;
      return;
    }
    this.supportRequestsService
      .updateSupportRequest(
        token,
        this.selectedRequest.id,
        this.adminResponse,
        this.adminStatus
      )
      .subscribe({
        next: (res) => {
          // Update the local data for immediate feedback
          this.selectedRequest.admin_response = this.adminResponse;
          this.selectedRequest.status = this.adminStatus;
          this.closeModal();
          this.loadSupportRequests(); // Refresh list
          this.submitting = false;
        },
        error: (err) => {
          this.formError = 'Failed to update support request.';
          this.submitting = false;
        },
      });
  }
}
