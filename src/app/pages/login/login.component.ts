import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ProfileService } from '../../services/profile.service';
import { PermissionsService } from '../../services/permissions-store.service';
import { LoginBgSvgComponent } from '../../ui/login-bg-svg/login-bg-svg.component';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  imports: [FormsModule, NgIf, LoginBgSvgComponent],
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  error: string = '';
  loading: boolean = false;
  rememberPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService,
    private profileService: ProfileService, // Inject ProfileService
    private userStore: PermissionsService // Inject UserStoreService
  ) {
    // Load remembered credentials if available
    const remembered = localStorage.getItem('rememberedCredentials');
    if (remembered) {
      try {
        const creds = JSON.parse(remembered);
        this.email = creds.email || '';
        this.password = creds.password || '';
        this.rememberPassword = true;
      } catch {}
    }
  }

  login() {
    // Clear old permissions before new login
    this.userStore.clearPermissions();
    // Input validation
    if (!this.email || !this.email.trim()) {
      this.toast.show('Email is required.', 'warning');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.email)) {
      this.toast.show('Enter a valid email.', 'warning');
      return;
    }
    if (!this.password || !this.password.trim()) {
      this.toast.show('Password is required.', 'warning');
      return;
    }
    if (this.password.length < 6) {
      this.toast.show('Password too short.', 'warning');
      return;
    }
    this.loading = true;
    this.error = '';
    if (this.rememberPassword) {
      localStorage.setItem(
        'rememberedCredentials',
        JSON.stringify({ email: this.email, password: this.password })
      );
    } else {
      localStorage.removeItem('rememberedCredentials');
    }
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        if (response && response.success) {
          if (response.data) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
          this.toast.show('Login successful!', 'success');
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.error = response?.message || 'Login failed';
          this.toast.show('Check your email and password.', 'error');
        }
        this.loading = false;
      },
      error: (err) => {
        console.log(err);
        this.error = err?.error?.message || 'Login failed';
        let userMessage = 'Check your email and password.';
        if (
          this.error &&
          (this.error.toLowerCase().includes('failed to login') ||
            this.error.toLowerCase().includes('invalid'))
        ) {
          userMessage = 'Check your email and password.';
        }
        this.toast.show(userMessage, 'error');
        this.loading = false;
      },
    });
  }
}
