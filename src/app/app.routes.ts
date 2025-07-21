import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { noAuthGuard } from './guards/no-auth.guard';
import { DashboardLayoutComponent } from './ui/dashboard-layout/dashboard-layout.component';
import { UsersComponent } from './pages/users/users.component';
import { ManagementComponent } from './pages/management/management.component';
import { SupportRequestsComponent } from './pages/support-requests/support-requests.component';
import { VehicleManagementComponent } from './pages/vehicle-management/vehicle-management.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { WorkshopComponent } from './pages/workshop/workshop.component';
import { OffersComponent } from './ui/offers/offers.component';

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
    children: [
      { path: '', component: DashboardComponent },
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'management',
        component: ManagementComponent,
      },
      {
        path: 'support-requests',
        component: SupportRequestsComponent,
      },
      {
        path: 'vehicles',
        component: VehicleManagementComponent,
      },
      {
        path: 'settings',
        component: SettingsComponent,
      },
      {
        path: 'workshop',
        component: WorkshopComponent,
      },
      {
        path: 'offers',
        component: OffersComponent,
      },
    ],
  },

  { path: '**', redirectTo: 'login', pathMatch: 'full' },
];
