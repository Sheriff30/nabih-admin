import { Component, OnInit } from '@angular/core';
import { ManagementService } from '../../services/management.service';

@Component({
  selector: 'app-management',
  standalone: true,
  imports: [],
  templateUrl: './management.component.html',
  styleUrl: './management.component.css',
})
export class ManagementComponent implements OnInit {
  constructor(private managementService: ManagementService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.managementService.listAdmins(token).subscribe({
        next: (res) => {
          console.log('Admins response:', res);
        },
        error: (err) => {
          console.error('Error fetching admins:', err);
        },
      });
    } else {
      console.warn('No token found in localStorage.');
    }
  }
}
