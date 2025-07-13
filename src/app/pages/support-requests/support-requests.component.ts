import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SupportRequestsService,
  SupportRequestsResponse,
} from '../../services/support-requests.service';

@Component({
  selector: 'app-support-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './support-requests.component.html',
  styleUrl: './support-requests.component.css',
})
export class SupportRequestsComponent implements OnInit {
  supportRequests: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private supportRequestsService: SupportRequestsService) {}

  ngOnInit(): void {
    this.loadSupportRequests();
  }

  loadSupportRequests(): void {
    this.loading = true;
    this.error = null;

    // Get token from localStorage
    const token = localStorage.getItem('token');

    if (!token) {
      this.error = 'No authentication token found';
      this.loading = false;
      return;
    }

    // Fetch support requests
    this.supportRequestsService.listSupportRequests(token, 1, 10).subscribe({
      next: (response: SupportRequestsResponse) => {
        console.log('Support Requests API Response:', response);
        console.log('Support Requests Data:', response.data);
        console.log('Support Requests List:', response.data.support_requests);
        console.log('Pagination Meta:', response.data.meta);

        this.supportRequests = response.data.support_requests;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error fetching support requests:', error);
        this.error = 'Failed to load support requests';
        this.loading = false;
      },
    });
  }
}
