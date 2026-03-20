import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UnlockComponent } from './pages/unlock/unlock.component';
import { ActivateAccountComponent } from './pages/activate-account/activate-account.component';
import { GoComponent } from './pages/go/go.component';

import { TermsComponent } from './pages/terms/terms.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';
import { FaqComponent } from './pages/faq/faq.component';
import { PricingComponent } from './pages/pricing/pricing.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { AdminUserDetailComponent } from './pages/admin-user-detail/admin-user-detail.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'activate-account', component: ActivateAccountComponent },
  { path: 'pricing', component: PricingComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'admin/users', component: AdminUsersComponent, canActivate: [AdminGuard] },
  { path: 'admin/users/:id', component: AdminUserDetailComponent, canActivate: [AdminGuard] },
  { path: 'analytics/:id', component: AnalyticsComponent, canActivate: [AuthGuard] },
  { path: 'terms', component: TermsComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'faq', component: FaqComponent },
  { path: 'go/:shortCode', component: GoComponent },
  { path: 'unlock/:shortCode', component: UnlockComponent },
  { path: '**', redirectTo: '' }
];
