import { Component, OnInit } from '@angular/core';
import { SupportRequestsService } from '../../services/support.requsets.service';

@Component({
  selector: 'app-support-requests',
  standalone: true,
  imports: [],
  templateUrl: './support-requests.component.html',
  styleUrl: './support-requests.component.css',
})
export class SupportRequestsComponent implements OnInit {
  constructor(private supportRequestsService: SupportRequestsService) {}

  ngOnInit() {
    this.loadSupportRequests();
  }

  loadSupportRequests() {
    // You'll need to get the token from your auth service
    const token = 'your-token-here'; // Replace with actual token from auth service

    this.supportRequestsService.getSupportRequests(token, 1, 10).subscribe({
      next: (res) => {
        console.log(res);
      },
      error: (error) => {
        console.error('Error fetching support requests:', error);
      },
    });
  }
}
