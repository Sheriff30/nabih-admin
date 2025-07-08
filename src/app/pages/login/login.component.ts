import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  imports: [FormsModule, NgIf],
})
export class LoginComponent {
  email: string = 'superadmin@nabih.com';
  password: string = 'SuperAdmin@123';
  error: string = '';
  loading: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.loading = true;
    this.error = '';
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        console.log(response);
        if (response && response.success) {
          console.log(response.data.token);
          localStorage.setItem('token', response.data.token);
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.error = response?.message || 'Login failed';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Login failed';
        this.loading = false;
      },
    });
  }
}
