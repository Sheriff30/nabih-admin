import { Component, OnInit } from '@angular/core';
import {
  ManagementService,
  AdminUserResource,
  PaginationMeta,
  RoleResource,
  CreateAdminRequest,
  ListPermissionsResponse,
  UpdateAdminRequest,
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

  // Edit admin modal state
  showEditAdminModal = false;
  editAdminLoading = false;
  editAdminForm: {
    id: number | null;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    roles: string[];
    direct_permissions: string[];
  } = {
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    roles: [],
    direct_permissions: [],
  };
  // Store original admin data for comparison
  originalAdminData: {
    first_name: string;
    last_name: string;
    email: string;
    roles: string[];
    direct_permissions: string[];
  } | null = null;
  allPermissions: { id: number | string; name: string }[] = [];
  rolePermissions: string[] = [];

  // Permissions modal state
  showPermissionsModal = false;
  permissionsModalLoading = false;
  permissionsModalDirect: string[] = [];

  // Getter to show all unique permissions for the admin (direct + role-based)
  get allAdminPermissions(): string[] {
    const all = [
      ...this.editAdminForm.direct_permissions,
      ...this.rolePermissions,
    ];
    return Array.from(new Set(all));
  }

  constructor(
    private managementService: ManagementService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAdmins();
    this.loadRoles();
    this.loadPermissions();
  }

  loadAdmins(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.loading = true;
      this.error = null;
      this.managementService
        .listAdmins(token, this.currentPage, this.perPage)
        .subscribe({
          next: (res) => {
            console.log(res);
            this.allAdmins = res.data.admins; // allAdmins is now the current page only
            this.admins = res.data.admins; // admins is also the current page only
            // Update pagination meta from backend
            this.paginationMeta = {
              current_page: Number(res.data.meta.current_page),
              last_page: Number(res.data.meta.last_page),
              per_page: Number(res.data.meta.per_page),
              total: Number(res.data.meta.total),
              next_page_url: res.data.meta.next_page_url,
              prev_page_url: res.data.meta.prev_page_url,
            };
            this.applyFiltersAndSorting();
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

  loadPermissions(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.managementService.listPermissions(token).subscribe({
        next: (res) => {
          this.allPermissions = res.data.permissions;
        },
        error: () => {
          this.toast.show('Failed to load permissions', 'error');
        },
      });
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
    this.formData.roles = selectedRole ? [selectedRole] : [];
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
        // Add the new admin to the local data instead of reloading
        if (res.data && res.data.admin) {
          this.allAdmins.unshift(res.data.admin);
          this.applyFiltersAndPagination();
        }
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
    if (
      !this.formData.roles ||
      !Array.isArray(this.formData.roles) ||
      this.formData.roles.length === 0
    ) {
      this.formError = 'At least one role is required';
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
  }

  // Apply search and sorting only to the current page (allAdmins)
  applyFiltersAndSorting(): void {
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
    if (this.sortColumn) {
      filteredAdmins = this.applySorting(filteredAdmins);
    }
    this.admins = filteredAdmins;
  }

  // Sorting methods
  sortAdmins(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSorting(); // Do not reload from backend
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
      this.loadAdmins();
    }
  }

  goToPreviousPage(): void {
    if (this.paginationMeta?.prev_page_url) {
      this.currentPage--;
      this.loadAdmins();
    }
  }

  goToNextPage(): void {
    if (this.paginationMeta?.next_page_url) {
      this.currentPage++;
      this.loadAdmins();
    }
  }

  onPerPageChange(newPerPage: number): void {
    this.perPage = newPerPage;
    this.currentPage = 1;
    this.loadAdmins();
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
        // Remove the admin from local data instead of reloading
        this.allAdmins = this.allAdmins.filter(
          (admin) => admin.id !== this.adminToDelete!.id
        );
        // If the current page is now empty and not the first page, move to previous page
        if (
          this.admins.length === 1 &&
          this.paginationMeta &&
          this.paginationMeta.current_page > 1
        ) {
          this.currentPage = this.paginationMeta.current_page - 1;
          this.loadAdmins();
        } else {
          this.loadAdmins();
        }
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

  openEditAdminModal(admin: AdminUserResource): void {
    this.editAdminForm = {
      id: admin.id,
      first_name: admin.first_name,
      last_name: admin.last_name,
      email: admin.email,
      password: '',
      roles: admin.roles.map((r) => r.name),
      direct_permissions: admin.direct_permissions.map((p) => p.name),
    };
    // Store original data for comparison
    this.originalAdminData = {
      first_name: admin.first_name,
      last_name: admin.last_name,
      email: admin.email,
      roles: admin.roles.map((r) => r.name),
      direct_permissions: admin.direct_permissions.map((p) => p.name),
    };
    this.rolePermissions = admin.roles.flatMap((r) =>
      r.permissions.map((p) => p.name)
    );
    this.showEditAdminModal = true;
  }

  closeEditAdminModal(): void {
    this.showEditAdminModal = false;
    this.originalAdminData = null;
  }

  // Check if there are any changes in the edit form
  hasChanges(): boolean {
    if (!this.originalAdminData) return false;

    return (
      this.editAdminForm.first_name !== this.originalAdminData.first_name ||
      this.editAdminForm.last_name !== this.originalAdminData.last_name ||
      this.editAdminForm.email !== this.originalAdminData.email ||
      this.editAdminForm.password !== '' ||
      JSON.stringify(this.editAdminForm.roles.sort()) !==
        JSON.stringify(this.originalAdminData.roles.sort()) ||
      JSON.stringify(this.editAdminForm.direct_permissions.sort()) !==
        JSON.stringify(this.originalAdminData.direct_permissions.sort())
    );
  }

  onEditRoleChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedRole = target.value;
    this.editAdminForm.roles = selectedRole ? [selectedRole] : [];
    const roleObj = this.availableRoles.find((r) => r.name === selectedRole);
    this.rolePermissions = roleObj
      ? roleObj.permissions.map((p) => p.name)
      : [];
  }

  // Permissions modal logic
  openPermissionsModal(): void {
    this.permissionsModalDirect = [...this.editAdminForm.direct_permissions];
    this.showPermissionsModal = true;
  }

  closePermissionsModal(): void {
    this.showPermissionsModal = false;
  }

  onPermissionsModalToggle(permission: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const checked = input?.checked;
    if (checked) {
      if (!this.permissionsModalDirect.includes(permission)) {
        this.permissionsModalDirect.push(permission);
      }
    } else {
      this.permissionsModalDirect = this.permissionsModalDirect.filter(
        (p) => p !== permission
      );
    }
  }

  savePermissionsModal(): void {
    this.permissionsModalLoading = true;
    const token = localStorage.getItem('token');
    if (!token || !this.editAdminForm.id) {
      this.toast.show('Authentication required', 'error');
      this.permissionsModalLoading = false;
      return;
    }
    this.managementService
      .assignPermissions(
        token,
        this.editAdminForm.id,
        this.permissionsModalDirect
      )
      .subscribe({
        next: () => {
          this.editAdminForm.direct_permissions = [
            ...this.permissionsModalDirect,
          ];
          this.permissionsModalLoading = false;
          this.showPermissionsModal = false;
          this.toast.show('Permissions updated successfully', 'success');
        },
        error: () => {
          this.toast.show('Failed to update permissions', 'error');
          this.permissionsModalLoading = false;
        },
      });
  }

  saveEditAdmin(): void {
    // Check if there are any changes
    if (!this.hasChanges()) {
      this.toast.show('No changes detected', 'info');
      return;
    }

    this.editAdminLoading = true;
    const token = localStorage.getItem('token');
    if (!token || !this.editAdminForm.id) {
      this.toast.show('Authentication required', 'error');
      this.editAdminLoading = false;
      return;
    }
    // 1. Update basic info
    const updateData: UpdateAdminRequest = {
      first_name: this.editAdminForm.first_name,
      last_name: this.editAdminForm.last_name,
      email: this.editAdminForm.email,
    };
    if (this.editAdminForm.password) {
      updateData.password = this.editAdminForm.password;
    }
    this.managementService
      .updateAdmin(token, this.editAdminForm.id, updateData)
      .subscribe({
        next: (updateRes) => {
          console.log('1. Update basic info response:', updateRes);
          // 2. Assign roles
          this.managementService
            .assignRoles(
              token,
              this.editAdminForm.id!,
              this.editAdminForm.roles
            )
            .subscribe({
              next: (rolesRes) => {
                console.log('2. Assign roles response:', rolesRes);
                this.editAdminLoading = false;
                // Update the admin in local data instead of reloading
                const adminIndex = this.allAdmins.findIndex(
                  (admin) => admin.id === this.editAdminForm.id
                );
                if (adminIndex !== -1) {
                  // Update the admin with new data
                  this.allAdmins[adminIndex] = {
                    ...this.allAdmins[adminIndex],
                    first_name: this.editAdminForm.first_name,
                    last_name: this.editAdminForm.last_name,
                    email: this.editAdminForm.email,
                    roles: this.availableRoles
                      .filter((role) =>
                        this.editAdminForm.roles.includes(role.name)
                      )
                      .map((role) => ({
                        id: parseInt(role.id),
                        name: role.name,
                        permissions: role.permissions,
                      })),
                    direct_permissions: this.allPermissions
                      .filter((permission) =>
                        this.editAdminForm.direct_permissions.includes(
                          permission.name
                        )
                      )
                      .map((permission) => ({
                        id:
                          typeof permission.id === 'string'
                            ? parseInt(permission.id)
                            : permission.id,
                        name: permission.name,
                      })),
                  };
                  this.applyFiltersAndPagination();
                }
                this.showEditAdminModal = false;
                this.toast.show('Admin updated successfully', 'success');
              },
              error: () => {
                this.toast.show('Failed to assign roles', 'error');
                this.editAdminLoading = false;
              },
            });
        },
        error: () => {
          this.toast.show('Failed to update admin info', 'error');
          this.editAdminLoading = false;
        },
      });
  }

  // Search method for template binding
  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.applyFiltersAndSorting(); // Do not reload from backend
  }
}
