import { NgFor, NgIf } from '@angular/common';
import {
  Component,
  HostListener,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  // imports: [NgFor, NgIf],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.css',
})
export class DashboardHeaderComponent implements OnInit {
  notifications = [
    {
      id: 1,
      title: 'Notification 1',
      message:
        'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Excepturi, accusamus!',
      read: false,
    },
    {
      id: 2,
      title: 'Notification 2',
      message:
        'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Excepturi, accusamus!',
      read: false,
    },
    // Add more notifications as needed
  ];
  notificationListOpen = false;
  headerTitle = 'Dashboard';
  @Output() openSidebar = new EventEmitter<void>();

  constructor(private router: Router) {}

  ngOnInit() {
    this.setHeaderTitle(this.router.url);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.setHeaderTitle(event.urlAfterRedirects || event.url);
      });
  }

  setHeaderTitle(url: string) {
    // Remove query params and fragments
    const cleanUrl = url.split('?')[0].split('#')[0];
    // Map routes to titles
    if (cleanUrl === '/dashboard') {
      this.headerTitle = 'Dashboard';
    } else if (cleanUrl === '/dashboard/profile') {
      this.headerTitle = 'Profile';
    } else {
      // Fallback: use last segment capitalized
      const last = cleanUrl.split('/').filter(Boolean).pop();
      this.headerTitle = last
        ? last.charAt(0).toUpperCase() + last.slice(1)
        : 'Dashboard';
    }
  }

  get unreadCount() {
    return this.notifications.filter((n) => !n.read).length;
  }

  toggleNotificationList() {
    this.notificationListOpen = !this.notificationListOpen;
  }

  markAllAsRead() {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (
      !target.closest('.notification-bell') &&
      !target.closest('.notification-list')
    ) {
      this.notificationListOpen = false;
    }
  }
}
