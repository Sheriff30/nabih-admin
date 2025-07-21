import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Subscription } from 'rxjs';
import { PermissionsService } from '../../services/permissions-store.service';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrls: ['./dashboard-sidebar.component.css'],
})
export class DashboardSidebarComponent implements OnInit, OnDestroy {
  navLinks = [
    { label: 'Dashboard', href: '/admin/dashboard' },
    {
      label: 'Users',
      href: '/admin/dashboard/users',
    },
    {
      label: 'Vehicles',
      href: '/admin/dashboard/vehicles',
    },
    {
      label: 'Workshop',
      href: '/admin/dashboard/workshop',
    },
    {
      label: 'Support Requests',
      href: '/admin/dashboard/support-requests',
    },

    {
      label: 'Admin Management',
      href: '/admin/dashboard/management',
    },
    {
      label: 'Offers',
      href: '/admin/dashboard/offers',
    },
    {
      label: 'Settings',
      href: '/admin/dashboard/settings',
    },
  ];

  user: any = null;

  ngOnInit(): void {
    document.addEventListener('mousedown', this.handleClickOutside, true);
    const userStr = localStorage.getItem('user');
    this.user = userStr ? JSON.parse(userStr) : null;
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousedown', this.handleClickOutside, true);
  }

  handleClickOutside = (event: MouseEvent) => {
    if (
      this.sidebarRef &&
      !this.sidebarRef.nativeElement.contains(event.target)
    ) {
      this.closeSidebar.emit();
    }
  };
  @Output() closeSidebar = new EventEmitter<void>();

  isLoggingOut = false;
  showLogoutModal = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private toast: ToastService,
    private permissionsStore: PermissionsService
  ) {}

  openLogoutModal() {
    this.showLogoutModal = true;
  }

  closeLogoutModal() {
    this.showLogoutModal = false;
  }

  confirmLogout() {
    this.showLogoutModal = false;
    this.logout();
  }

  logout() {
    this.isLoggingOut = true;
    localStorage.removeItem('user');
    this.permissionsStore.clearPermissions();
    this.user = null;

    const token = localStorage.getItem('token');
    this.router.navigate(['/login']);

    if (token) {
      localStorage.removeItem('token');
      this.authService.logout(token).subscribe({
        next: () => {
          this.toast.show('You have been logged out. See you soon!', 'success');
        },
        error: () => {
          this.toast.show(
            'Logged out. If you need to log in again, just come back!',
            'info'
          );
        },
      });
    } else {
      this.toast.show('You are already logged out.', 'info');
    }
    this.isLoggingOut = false;
  }

  @ViewChild('sidebar', { static: true }) sidebarRef!: ElementRef;
}
