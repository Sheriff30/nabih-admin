import { Component, OnInit } from '@angular/core';
import { UsersService } from '../../services/users.service';
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

  constructor(private usersService: UsersService) {}

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers(
    page: number = this.pagination.current_page,
    per_page: number = this.pagination.per_page,
    search: string = this.searchTerm
  ) {
    const token = localStorage.getItem('token');
    if (token) {
      this.loading = true;
      this.usersService.listCustomers(token, page, per_page, search).subscribe({
        next: (res) => {
          if (res.success && res.data && res.data.customers) {
            const customers = res.data.customers;
            if (Array.isArray(customers)) {
              this.users = customers;
              this.pagination = { ...this.pagination, total: customers.length };
            } else if (customers && Array.isArray((customers as any).data)) {
              this.users = (customers as any).data;
              this.pagination = {
                ...this.pagination,
                current_page: (customers as any).current_page,
                per_page: (customers as any).per_page,
                total: (customers as any).total,
                from: (customers as any).from,
                to: (customers as any).to,
                last_page: (customers as any).last_page,
              };
            } else {
              this.users = [];
              this.pagination = { ...this.pagination, total: 0 };
            }
            this.applySorting();
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading customers:', error);
          this.loading = false;
        },
      });
    } else {
      console.error('No token found');
    }
  }

  showUser(user: any) {
    this.selectedUser = { ...user };
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.selectedUser = null;
  }

  saveUser() {
    if (!this.selectedUser) return;
    const token = localStorage.getItem('token');
    if (token) {
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
            this.loadCustomers(this.pagination.current_page);
            this.closeEditModal();
          },
          error: (err) => {
            alert('Failed to update user');
          },
        });
    }
  }

  deleteUser(user: any) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const token = localStorage.getItem('token');
    if (token) {
      this.usersService.deleteCustomer(user.id, token).subscribe({
        next: (res) => {
          this.loadCustomers(this.pagination.current_page);
        },
        error: (err) => {
          alert('Failed to delete user');
        },
      });
    }
  }

  sortUsers(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  applySorting() {
    if (!this.sortColumn) return;
    this.users = [...this.users].sort((a, b) => {
      let aValue = a[this.sortColumn];
      let bValue = b[this.sortColumn];
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

  onSearch(term: string) {
    this.searchTerm = term;
    this.loadCustomers(1, this.pagination.per_page, this.searchTerm);
  }

  goToPage(page: number) {
    this.pagination.current_page = page;
    this.loadCustomers(page, this.pagination.per_page, this.searchTerm);
  }

  onPerPageChange() {
    this.pagination.current_page = 1;
    this.loadCustomers(1, this.pagination.per_page, this.searchTerm);
  }
}
