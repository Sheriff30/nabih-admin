import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SupportRequestsService,
  SupportRequestsResponse,
} from '../../services/support-requests.service';
import { ToastService } from '../../services/toast.service';

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
  // Pagination meta from backend
  pagination = {
    current_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
    last_page: 1,
  };

  // Modal and tab state
  showModal = false;
  selectedRequest: any = null;
  activeTab: 'details' | 'admin' = 'details';
  adminResponse: string = '';
  adminStatus: 'pending' | 'open' | 'closed' = 'pending';
  submitting = false;
  formError: string | null = null;

  // Delete modal state
  showDeleteModal = false;
  requestToDelete: any = null;
  deleteLoading: boolean = false;

  constructor(
    private supportRequestsService: SupportRequestsService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadSupportRequests();
  }

  loadSupportRequests(): void {
    this.loading = true;
    this.error = null;
    const token = localStorage.getItem('token');
    if (!token) {
      this.error = 'No authentication token found';
      this.loading = false;
      this.toast.show('Authentication required. Please log in again.', 'error');
      return;
    }
    this.supportRequestsService
      .listSupportRequests(
        token,
        this.pagination.current_page,
        this.pagination.per_page
      )
      .subscribe({
        next: (response: SupportRequestsResponse) => {
          this.allSupportRequests = response.data.support_requests; // current page only
          this.supportRequests = response.data.support_requests; // current page only
          // Update pagination meta from backend
          this.pagination = {
            current_page: Number(response.data.meta.current_page),
            per_page: Number(response.data.meta.per_page),
            total: Number(response.data.meta.total),
            from:
              response.data.support_requests.length > 0
                ? (Number(response.data.meta.current_page) - 1) *
                    Number(response.data.meta.per_page) +
                  1
                : 0,
            to:
              response.data.support_requests.length > 0
                ? (Number(response.data.meta.current_page) - 1) *
                    Number(response.data.meta.per_page) +
                  response.data.support_requests.length
                : 0,
            last_page: Number(response.data.meta.last_page),
          };
          this.applyFiltersAndSorting();
          this.loading = false;
        },
        error: (error: any) => {
          this.error = 'Failed to load support requests';
          this.loading = false;
          this.toast.show(
            'Failed to load support requests. Please try again.',
            'error'
          );
        },
      });
  }

  // Apply search and sorting only to the current page (allSupportRequests)
  applyFiltersAndSorting() {
    let filtered = this.allSupportRequests;
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = this.allSupportRequests.filter((req) => {
        return (
          req.request_id?.toLowerCase().includes(term) ||
          req.subject?.toLowerCase().includes(term) ||
          req.issue_type?.toLowerCase().includes(term)
        );
      });
    }
    if (this.sortField) {
      filtered = filtered.slice().sort((a, b) => {
        let aValue = a[this.sortField];
        let bValue = b[this.sortField];
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
    this.supportRequests = filtered;
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.applyFiltersAndSorting(); // Do not reload from backend
  }

  onSort(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSorting(); // Do not reload from backend
  }

  onPageChange(page: number) {
    this.pagination.current_page = page;
    this.loadSupportRequests();
  }

  onPageSizeChange(size: number) {
    this.pagination.per_page = size;
    this.pagination.current_page = 1;
    this.loadSupportRequests();
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.pagination.last_page }, (_, i) => i + 1);
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
      this.toast.show('Please enter a response before saving.', 'error');
      return;
    }
    this.submitting = true;
    this.formError = null;
    const token = localStorage.getItem('token');
    if (!token) {
      this.formError = 'No authentication token found';
      this.submitting = false;
      this.toast.show('Authentication required. Please log in again.', 'error');
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
          this.toast.show('Support request updated successfully.', 'success');
        },
        error: (err) => {
          this.formError = 'Failed to update support request.';
          this.submitting = false;
          this.toast.show(
            'Failed to update support request. Please try again.',
            'error'
          );
        },
      });
  }

  openDeleteModal(request: any) {
    this.requestToDelete = request;
    this.showDeleteModal = true;
    this.deleteLoading = false;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.requestToDelete = null;
    this.deleteLoading = false;
  }

  confirmDeleteRequest() {
    if (!this.requestToDelete) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    this.deleteLoading = true;
    this.supportRequestsService
      .deleteSupportRequest(token, this.requestToDelete.id)
      .subscribe({
        next: () => {
          this.allSupportRequests = this.allSupportRequests.filter(
            (r) => r.id !== this.requestToDelete.id
          );
          // Recalculate pagination after deletion
          const total = this.supportRequests.length - 1;
          const lastPage = Math.max(
            1,
            Math.ceil(this.pagination.total - 1 / this.pagination.per_page)
          );
          // If the current page is now empty and not the first page, move to previous page
          if (
            this.supportRequests.length === 1 &&
            this.pagination.current_page > 1
          ) {
            this.pagination.current_page--;
            this.loadSupportRequests();
          } else {
            // Otherwise, just reload the current page
            this.loadSupportRequests();
          }
          this.closeDeleteModal();
          this.toast.show('Support request deleted successfully.', 'success');
        },
        error: () => {
          this.deleteLoading = false;
          this.toast.show(
            'Failed to delete support request. Please try again.',
            'error'
          );
        },
      });
  }
}
