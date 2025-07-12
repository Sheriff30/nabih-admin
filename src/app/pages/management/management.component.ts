import { Component, OnInit } from '@angular/core';
import {
  ManagementService,
  AdminUserResource,
  PaginationMeta,
  RoleResource,
  CreateAdminRequest,
} from '../../services/management.service';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-management',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './management.component.html',
  styleUrl: './management.component.css',
})
export class ManagementComponent implements OnInit {
  // All admins from API (unfiltered)
  allAdmins: AdminUserResource[] = [];

  // Displayed admins (filtered and paginated)
  admins: AdminUserResource[] = [];

  paginationMeta: PaginationMeta | null = null;
  loading = false;
  error: string | null = null;

  // Pagination state
  currentPage = 1;
  perPage = 10;

  // Search state
  searchTerm = '';
  private searchSubject = new Subject<string>();

  // Sorting state
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Form state
  showAddAdminForm = false;
  formLoading = false;
  formError: string | null = null;
  formSuccess: string | null = null;

  // Form data
  formData: CreateAdminRequest = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    roles: null,
    permissions: [],
  };

  // Available roles
  availableRoles: RoleResource[] = [];

  // Make Math available in template
  Math = Math;

  // Add state for delete loading and error
  deleteLoading: number | null = null;
  deleteError: string | null = null;

  // Add state for delete modal
  showDeleteModal: boolean = false;
  adminToDelete: AdminUserResource | null = null;

  constructor(
    private managementService: ManagementService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.setupSearch();
    this.loadAdmins();
    this.loadRoles();
  }

  setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(500), // Wait 500ms after user stops typing
        distinctUntilChanged() // Only emit if value has changed
      )
      .subscribe((searchTerm) => {
        this.currentPage = 1; // Reset to first page when searching
        this.applyFiltersAndPagination();
      });
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.searchSubject.next(this.searchTerm);
  }

  loadAdmins(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.loading = true;
      this.error = null;
      this.managementService
        .listAdmins(token, 1, 1000, this.searchTerm)
        .subscribe({
          next: (res) => {
            this.allAdmins = res.data.admins;
            this.applyFiltersAndPagination();
            this.loading = false;
          },
          error: (err) => {
            this.error = 'Failed to load admin users';
            this.loading = false;
            this.toast.show(this.error, 'error');
          },
        });
    } else {
      this.error = 'Authentication required';
      this.toast.show(this.error, 'error');
    }
  }

  loadRoles(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.managementService.listRoles(token).subscribe({
        next: (res) => {
          this.availableRoles = res.data.roles;
        },
        error: (err) => {
          this.toast.show('Failed to load roles', 'error');
        },
      });
    } else {
      this.toast.show('Authentication required', 'error');
    }
  }

  // Form methods
  showAddAdminModal(): void {
    this.showAddAdminForm = true;
    this.resetForm();
  }

  hideAddAdminModal(): void {
    this.showAddAdminForm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.formData = {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      roles: null,
      permissions: [],
    };
    this.formError = null;
    this.formSuccess = null;
  }

  onRoleChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedRole = target.value;

    if (selectedRole) {
      this.formData.roles = [selectedRole];
    }
  }

  removeRole(): void {
    this.formData.roles = null;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      this.toast.show(this.formError || 'Invalid form', 'error');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      this.formError = 'Authentication required';
      this.toast.show(this.formError || '', 'error');
      return;
    }
    this.formLoading = true;
    this.formError = null;
    this.managementService.createAdmin(token, this.formData).subscribe({
      next: (res) => {
        this.formLoading = false;
        this.managementService.clearAdminsCache();
        this.loadAdmins();
        this.toast.show('Admin user created successfully', 'success');
        this.hideAddAdminModal();
      },
      error: (err) => {
        if (err.status === 422 && err.error?.errors) {
          const errorMessages = [];
          for (const [field, messages] of Object.entries(err.error.errors)) {
            if (Array.isArray(messages)) {
              errorMessages.push(...messages);
            } else {
              errorMessages.push(messages as string);
            }
          }
          this.formError = errorMessages.join(', ');
        } else {
          this.formError = err.error?.message || 'Failed to create admin user';
        }
        this.formLoading = false;
        this.toast.show(this.formError || '', 'error');
      },
    });
  }

  validateForm(): boolean {
    if (!this.formData.first_name?.trim()) {
      this.formError = 'First name is required';
      return false;
    }
    if (!this.formData.last_name?.trim()) {
      this.formError = 'Last name is required';
      return false;
    }
    if (!this.formData.email?.trim()) {
      this.formError = 'Email is required';
      return false;
    }
    if (!this.formData.password?.trim()) {
      this.formError = 'Password is required';
      return false;
    }
    if (this.formData.password.length < 8) {
      this.formError = 'Password must be at least 8 characters';
      return false;
    }

    this.formError = null;
    return true;
  }

  applyFiltersAndPagination(): void {
    // Apply search filter
    let filteredAdmins = this.allAdmins;
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filteredAdmins = this.allAdmins.filter(
        (admin) =>
          admin.first_name.toLowerCase().includes(searchLower) ||
          admin.last_name.toLowerCase().includes(searchLower) ||
          admin.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (this.sortColumn) {
      filteredAdmins = this.applySorting(filteredAdmins);
    }

    // Calculate pagination
    const total = filteredAdmins.length;
    const lastPage = Math.ceil(total / this.perPage);
    const startIndex = (this.currentPage - 1) * this.perPage;
    const endIndex = startIndex + this.perPage;

    // Get current page data
    this.admins = filteredAdmins.slice(startIndex, endIndex);

    // Update pagination meta
    this.paginationMeta = {
      current_page: this.currentPage,
      last_page: lastPage,
      per_page: this.perPage,
      total: total,
      next_page_url: this.currentPage < lastPage ? 'next' : null,
      prev_page_url: this.currentPage > 1 ? 'prev' : null,
    };

    console.log('Applied filters and pagination:', {
      total: total,
      perPage: this.perPage,
      currentPage: this.currentPage,
      lastPage: lastPage,
      displayedCount: this.admins.length,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
    });
  }

  // Sorting methods
  sortAdmins(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndPagination();
  }

  applySorting(admins: AdminUserResource[]): AdminUserResource[] {
    return [...admins].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'name':
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'role':
          aValue = this.getRoleNames(a.roles).toLowerCase();
          bValue = this.getRoleNames(b.roles).toLowerCase();
          break;
        case 'status':
          aValue = this.getStatusText(a).toLowerCase();
          bValue = this.getStatusText(b).toLowerCase();
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= (this.paginationMeta?.last_page || 1)) {
      this.currentPage = page;
      this.applyFiltersAndPagination();
    }
  }

  goToPreviousPage(): void {
    if (this.paginationMeta?.prev_page_url) {
      this.currentPage--;
      this.applyFiltersAndPagination();
    }
  }

  goToNextPage(): void {
    if (this.paginationMeta?.next_page_url) {
      this.currentPage++;
      this.applyFiltersAndPagination();
    }
  }

  onPerPageChange(newPerPage: number): void {
    console.log('Per page changed:', {
      oldValue: this.perPage,
      newValue: newPerPage,
    });
    this.perPage = newPerPage;
    this.currentPage = 1; // Reset to first page when changing per page
    this.applyFiltersAndPagination();
  }

  getRoleNames(roles: any[]): string {
    return roles.map((role) => this.formatRoleName(role.name)).join(', ');
  }

  formatRoleName(roleName: string): string {
    switch (roleName.toLowerCase()) {
      case 'super-admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      default:
        return roleName;
    }
  }

  getStatusColor(admin: AdminUserResource): string {
    // You can implement custom logic here based on admin status
    // For now, we'll show all as active since the API doesn't provide status
    return 'bg-green-50 border border-green-200 text-green-600';
  }

  getStatusText(admin: AdminUserResource): string {
    // You can implement custom logic here based on admin status
    return 'Active';
  }

  getPageNumbers(): number[] {
    if (!this.paginationMeta) return [];

    const currentPage = this.paginationMeta.current_page;
    const lastPage = this.paginationMeta.last_page;
    const pages: number[] = [];

    // Show up to 5 pages around current page
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(lastPage, currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Open the delete confirmation modal for a specific admin
   */
  openDeleteModal(admin: AdminUserResource): void {
    this.adminToDelete = admin;
    this.showDeleteModal = true;
    this.deleteError = null;
  }

  /**
   * Close the delete confirmation modal
   */
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.adminToDelete = null;
    this.deleteError = null;
  }

  /**
   * Confirm deletion of the selected admin
   */
  confirmDeleteAdmin(): void {
    if (!this.adminToDelete) return;
    const token = localStorage.getItem('token');
    if (!token) {
      this.deleteError = 'Authentication required';
      this.toast.show(this.deleteError || '', 'error');
      return;
    }
    this.deleteLoading = this.adminToDelete.id;
    this.deleteError = null;
    this.managementService.deleteAdmin(token, this.adminToDelete.id).subscribe({
      next: (res) => {
        this.deleteLoading = null;
        this.managementService.clearAdminsCache();
        this.loadAdmins();
        this.closeDeleteModal();
        this.toast.show('Admin deleted successfully', 'success');
      },
      error: (err) => {
        this.deleteLoading = null;
        this.deleteError = err.error?.message || 'Failed to delete admin user';
        this.toast.show(this.deleteError || '', 'error');
      },
    });
  }
}
