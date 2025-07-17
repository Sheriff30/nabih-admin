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

  profile: any = null;
  isLoggingOut = false;

  constructor(private router: Router, private authService: AuthService) {}

  logout() {
    this.isLoggingOut = true;
    const token = localStorage.getItem('token');
    if (token) {
      this.authService.logout(token).subscribe({
        next: () => {
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
          this.isLoggingOut = false;
        },
        error: () => {
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
          this.isLoggingOut = false;
        },
      });
    } else {
      this.router.navigate(['/login']);
      this.isLoggingOut = false;
    }
  }

  @ViewChild('sidebar', { static: true }) sidebarRef!: ElementRef;
}
