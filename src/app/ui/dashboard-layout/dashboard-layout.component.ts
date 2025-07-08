import { Component, ChangeDetectorRef, HostListener } from '@angular/core';
import { DashboardSidebarComponent } from '../dashboard-sidebar/dashboard-sidebar.component';
import { DashboardHeaderComponent } from '../dashboard-header/dashboard-header.component';
import { RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-dashboard-layout',
  imports: [
    DashboardSidebarComponent,
    DashboardSidebarComponent,
    DashboardHeaderComponent,
    RouterModule,
    NgIf,
  ],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.css',
})
export class DashboardLayoutComponent {
  sidebarOpen = false;

  constructor(private cdr: ChangeDetectorRef) {}

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
