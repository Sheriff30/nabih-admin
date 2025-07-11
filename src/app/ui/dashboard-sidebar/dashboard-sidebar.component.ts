import { Component, Output, EventEmitter, OnInit } from '@angular/core';
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
export class DashboardSidebarComponent implements OnInit {
  navLinks = [{ label: 'Dashboard', href: '/admin/dashboard' }];

  ngOnInit(): void {}
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
}
