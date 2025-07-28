import { Component, OnInit, OnDestroy } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { ToastService } from '../../services/toast.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PermissionsService } from '../../services/permissions-store.service';
import { AccessDeniedComponent } from '../access-denied/access-denied.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AccessDeniedComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit, OnDestroy {
  // All users from API (unfiltered)
  allUsers: any[] = [];

  // Displayed users (filtered and paginated)
  users: any[] = [];

  pagination = {
    current_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
    last_page: 1,
  };
  searchTerm: string = '';
  selectedUser: any = null;
  isEditModalOpen: boolean = false;
  loading: boolean = false;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  isDeleteConfirmOpen: boolean = false;
  userToDelete: any = null;
  deleteLoading: boolean = false;
  updateLoading: boolean = false;
  originalUserData: any = null;
  permissionsLoading = true;
  private permissionsSub: Subscription | undefined;

  constructor(
    private usersService: UsersService,
    private toast: ToastService,
    public permissionsStore: PermissionsService
  ) {}

  ngOnInit() {
    this.permissionsSub = this.permissionsStore.permissions$.subscribe(
      (permissions) => {
        if (permissions && permissions.length > 0) {
          this.permissionsLoading = false;
        }
      }
    );
    this.loadCustomers();
  }

  ngOnDestroy() {
    if (this.permissionsSub) {
      this.permissionsSub.unsubscribe();
    }
  }

  loadCustomers() {
    const token = localStorage.getItem('token');
    if (token) {
      this.loading = true;
      this.usersService
        .listCustomers(
          token,
          this.pagination.current_page,
          this.pagination.per_page
        )
        .subscribe({
          next: (res) => {
            if (res.success && res.data && res.data.customers) {
              this.allUsers = res.data.customers; // allUsers is now the current page only
              // Update pagination meta from backend
              this.pagination = {
                current_page: Number(res.data.meta.current_page),
                per_page: Number(res.data.meta.per_page),
                total: Number(res.data.meta.total),
                from:
                  res.data.customers.length > 0
                    ? (Number(res.data.meta.current_page) - 1) *
                        Number(res.data.meta.per_page) +
                      1
                    : 0,
                to:
                  res.data.customers.length > 0
                    ? (Number(res.data.meta.current_page) - 1) *
                        Number(res.data.meta.per_page) +
                      res.data.customers.length
                    : 0,
                last_page: Number(res.data.meta.last_page),
              };
              // Apply search and sorting to the new data
              this.applyFiltersAndPagination();
            } else {
              this.allUsers = [];
              this.users = [];
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error loading customers:', error);
            this.loading = false;
            // this.toast.show('Failed to load users', 'error');
          },
        });
    } else {
      console.error('No token found');
      this.toast.show('Authentication required', 'error');
    }
  }

  applyFiltersAndPagination() {
    // Apply search and sorting only to the current page (allUsers)
    let filteredUsers = this.allUsers;
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filteredUsers = this.allUsers.filter(
        (user) =>
          (user.name && user.name.toLowerCase().includes(searchLower)) ||
          (user.phone_number &&
            user.phone_number.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower))
      );
    }
    // Apply sorting to filtered users
    if (this.sortColumn) {
      filteredUsers = this.applySorting(filteredUsers);
    }
    this.users = filteredUsers;
  }

  showUser(user: any) {
    this.selectedUser = { ...user };
    this.originalUserData = { ...user };
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.selectedUser = null;
    this.originalUserData = null;
  }

  // Check if there are any changes in the user form
  hasChanges(): boolean {
    if (!this.originalUserData || !this.selectedUser) return false;

    return (
      this.selectedUser.name !== this.originalUserData.name ||
      this.selectedUser.is_verified !== this.originalUserData.is_verified
    );
  }

  saveUser() {
    if (!this.selectedUser) return;

    // Check if there are any changes
    if (!this.hasChanges()) {
      this.toast.show('No changes detected', 'info');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.toast.show('Authentication required', 'error');
      return;
    }

    this.updateLoading = true;
    this.usersService
      .updateCustomer(
        this.selectedUser.id,
        {
          name: this.selectedUser.name,
          phone_number: this.selectedUser.phone_number,
          is_verified: this.selectedUser.is_verified,
        },
        token
      )
      .subscribe({
        next: (res) => {
          console.log(res);
          // Update the user in allUsers array
          const index = this.allUsers.findIndex(
            (u) => u.id === this.selectedUser.id
          );
          if (index !== -1) {
            this.allUsers[index] = {
              ...this.allUsers[index],
              ...this.selectedUser,
            };
          }
          this.applyFiltersAndPagination();
          this.closeEditModal();
          this.toast.show('User updated successfully', 'success');
          this.updateLoading = false;
        },
        error: (err) => {
          console.log(err);
          const errorMessage = err.error?.message || 'Failed to update user';
          this.toast.show(errorMessage, 'error');
          this.updateLoading = false;
        },
      });
  }

  deleteUser(user: any) {
    this.isDeleteConfirmOpen = true;
    this.userToDelete = user;
  }

  confirmDeleteUser() {
    if (!this.userToDelete) return;
    const token = localStorage.getItem('token');
    if (!token) {
      this.toast.show('Authentication required', 'error');
      return;
    }

    this.deleteLoading = true;
    this.usersService.deleteCustomer(this.userToDelete.id, token).subscribe({
      next: (res) => {
        // Remove the user from allUsers array
        this.allUsers = this.allUsers.filter(
          (u) => u.id !== this.userToDelete.id
        );
        // If the current page is now empty and not the first page, move to previous page
        if (this.users.length === 1 && this.pagination.current_page > 1) {
          this.pagination.current_page--;
          this.loadCustomers();
        } else {
          this.loadCustomers();
        }
        this.isDeleteConfirmOpen = false;
        this.userToDelete = null;
        this.closeEditModal();
        this.toast.show('User deleted successfully', 'success');
        this.deleteLoading = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Failed to delete user';
        this.toast.show(errorMessage, 'error');
        this.isDeleteConfirmOpen = false;
        this.userToDelete = null;
        this.deleteLoading = false;
      },
    });
  }

  cancelDeleteUser() {
    this.isDeleteConfirmOpen = false;
    this.userToDelete = null;
  }

  sortUsers(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndPagination(); // Do not reset pagination or reload from backend
  }

  applySorting(users: any[]): any[] {
    return [...users].sort((a, b) => {
      let aValue = a[this.sortColumn];
      let bValue = b[this.sortColumn];

      // Handle special cases for different column types
      switch (this.sortColumn) {
        case 'vehicles':
          // Sort by vehicle_count, treat null/undefined as 0
          aValue = a.vehicle_count || 0;
          bValue = b.vehicle_count || 0;
          break;
        default:
          // Default sorting behavior
          if (aValue == null) aValue = '';
          if (bValue == null) bValue = '';
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
          }
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.applyFiltersAndPagination(); // Do not reset pagination or reload from backend
  }

  goToPage(page: number) {
    this.pagination.current_page = page;
    this.loadCustomers();
  }

  onPerPageChange() {
    this.pagination.current_page = 1;
    this.loadCustomers();
  }

  // PERMISSIONS

  handleViewUser(user: any) {
    if (this.permissionsStore.hasPermission('customer.view.single')) {
      this.showUser(user);
    } else {
      this.toast.show(
        'You do not have permission to view user details.',
        'error'
      );
    }
  }

  handleDeleteUser(user: any) {
    if (this.permissionsStore.hasPermission('customer.delete')) {
      this.deleteUser(user);
    } else {
      this.toast.show('You do not have permission to delete users.', 'error');
    }
  }

  handleUpdateUser() {
    if (this.permissionsStore.hasPermission('customer.update')) {
      this.saveUser();
    } else {
      this.toast.show('You do not have permission to update users.', 'error');
    }
  }
}
