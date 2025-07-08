import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { noAuthGuard } from './guards/no-auth.guard';
import { DashboardLayoutComponent } from './ui/dashboard-layout/dashboard-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [noAuthGuard],
  },

  {
    path: 'admin/dashboard',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [{ path: '', component: DashboardComponent }],
  },

  { path: '**', redirectTo: 'login', pathMatch: 'full' },
];
