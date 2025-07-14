import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  loadingStatistics = true;
  statistics: any = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.dashboardService.getMaintenanceLogs(token).subscribe({
        next: (logs) => {
          console.log('Maintenance Logs:', logs);
        },
        error: (err) => {
          console.error('Failed to fetch maintenance logs:', err);
        },
      });
      this.loadingStatistics = true;
      this.dashboardService.getStatistics(token).subscribe({
        next: (stats) => {
          console.log('Dashboard Statistics:', stats);
          this.statistics = stats;
          this.loadingStatistics = false;
        },
        error: (err) => {
          console.error('Failed to fetch dashboard statistics:', err);
          this.loadingStatistics = false;
        },
      });
    } else {
      console.warn('No token found in localStorage.');
      this.loadingStatistics = false;
    }
  }
}
