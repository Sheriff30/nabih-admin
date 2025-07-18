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
import { UserStoreService } from '../../services/user-store.service';
import { Subscription } from 'rxjs';

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
      label: 'Settings',
      href: '/admin/dashboard/settings',
    },
  ];

  ngOnInit(): void {
    document.addEventListener('mousedown', this.handleClickOutside, true);
    this.profileSub = this.userStore.profile$.subscribe((profile) => {
      this.profile = profile;
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousedown', this.handleClickOutside, true);
    if (this.profileSub) {
      this.profileSub.unsubscribe();
    }
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

  profile: any = null;
  private profileSub: Subscription | undefined;
  isLoggingOut = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private toast: ToastService,
    private userStore: UserStoreService
  ) {}

  logout() {
    this.isLoggingOut = true;
    const token = localStorage.getItem('token');
    if (token) {
      this.authService.logout(token).subscribe({
        next: () => {
          localStorage.removeItem('token');
          this.toast.show('You have been logged out. See you soon!', 'success');
          this.router.navigate(['/login']);
          this.isLoggingOut = false;
          this.profile = null;
        },
        error: () => {
          localStorage.removeItem('token');
          this.toast.show(
            'Logged out. If you need to log in again, just come back!',
            'info'
          );
          this.router.navigate(['/login']);
          this.isLoggingOut = false;
          this.profile = null;
        },
      });
    } else {
      this.toast.show('You are already logged out.', 'info');
      this.router.navigate(['/login']);
      this.isLoggingOut = false;
      this.profile = null;
    }
  }

  @ViewChild('sidebar', { static: true }) sidebarRef!: ElementRef;
}
