import { Component, OnInit } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { ToastService } from '../../services/toast.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
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

  constructor(
    private usersService: UsersService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    const token = localStorage.getItem('token');
    if (token) {
      this.loading = true;
      this.usersService.listCustomers(token, 1, 1000, '').subscribe({
        next: (res) => {
          console.log(res);
          if (res.success && res.data && res.data.customers) {
            const customers = res.data.customers;
            if (Array.isArray(customers)) {
              this.allUsers = customers;
            } else if (customers && Array.isArray((customers as any).data)) {
              this.allUsers = (customers as any).data;
            } else {
              this.allUsers = [];
            }
            this.applyFiltersAndPagination();
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading customers:', error);
          this.loading = false;
          this.toast.show('Failed to load users', 'error');
        },
      });
    } else {
      console.error('No token found');
      this.toast.show('Authentication required', 'error');
    }
  }

  applyFiltersAndPagination() {
    // Apply search filter
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

    // Apply sorting
    if (this.sortColumn) {
      filteredUsers = this.applySorting(filteredUsers);
    }

    // Calculate pagination
    const total = filteredUsers.length;
    const lastPage = Math.ceil(total / this.pagination.per_page);
    const startIndex =
      (this.pagination.current_page - 1) * this.pagination.per_page;
    const endIndex = startIndex + this.pagination.per_page;

    // Get current page data
    this.users = filteredUsers.slice(startIndex, endIndex);

    // Update pagination meta
    this.pagination = {
      current_page: this.pagination.current_page,
      per_page: this.pagination.per_page,
      total: total,
      from: total > 0 ? startIndex + 1 : 0,
      to: Math.min(endIndex, total),
      last_page: lastPage,
    };

    console.log('Applied filters and pagination:', {
      total: total,
      perPage: this.pagination.per_page,
      currentPage: this.pagination.current_page,
      lastPage: lastPage,
      displayedCount: this.users.length,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
    });
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
          gender: this.selectedUser.gender,
          is_verified: this.selectedUser.is_verified, // include active status
        },
        token
      )
      .subscribe({
        next: (res) => {
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
        this.applyFiltersAndPagination();
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
    this.applyFiltersAndPagination();
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
    this.pagination.current_page = 1; // Reset to first page when searching
    this.applyFiltersAndPagination();
  }

  goToPage(page: number) {
    this.pagination.current_page = page;
    this.applyFiltersAndPagination();
  }

  onPerPageChange() {
    this.pagination.current_page = 1; // Reset to first page when changing per page
    this.applyFiltersAndPagination();
  }
}
