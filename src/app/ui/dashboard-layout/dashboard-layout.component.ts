import {
  Component,
  ChangeDetectorRef,
  HostListener,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { DashboardSidebarComponent } from '../dashboard-sidebar/dashboard-sidebar.component';
import { DashboardHeaderComponent } from '../dashboard-header/dashboard-header.component';
import { RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { ProfileService } from '../../services/profile.service';
import { UserStoreService } from '../../services/user-store.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    DashboardSidebarComponent,
    DashboardHeaderComponent,
    RouterModule,
    NgIf,
  ],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.css',
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  sidebarOpen = false;
  private refreshSub: Subscription | undefined;

  constructor(
    private cdr: ChangeDetectorRef,
    private profileService: ProfileService,
    private userStore: UserStoreService
  ) {}

  private fetchProfileIfAuthenticated() {
    const token = localStorage.getItem('token');
    if (token) {
      this.profileService.getProfile().subscribe({
        next: (profile) => {
          this.userStore.setProfile(profile.data.admin);
        },
        error: (err) => {
          // Optionally handle error (e.g., force logout if unauthorized)
        },
      });
    }
  }

  ngOnInit() {
    // Fetch profile on load if token exists
    this.fetchProfileIfAuthenticated();
  }

  ngOnDestroy() {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }

  get isLargeScreen() {
    return window.innerWidth >= 1024;
  }

  @HostListener('window:resize')
  onResize() {
    this.cdr.detectChanges();
  }

  openSidebar() {
    this.sidebarOpen = true;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }
}
