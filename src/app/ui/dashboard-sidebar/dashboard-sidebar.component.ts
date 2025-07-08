import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-sidebar',
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

  constructor(private router: Router) {}
}
