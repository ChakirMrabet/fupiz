import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BillingService } from '../../services/billing.service';
import { AuthService } from '../../services/auth.service';
import { FeatureIconComponent } from '../../components/ui/feature-icon.component';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, FeatureIconComponent],
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.css']
})
export class PricingComponent implements OnInit {
  readonly icons = {
    included: '<path d="M20 6 9 17l-5-5"/>',
    excluded: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
  };

  plans: any[] = [];
  currentPlan = 'FREE';
  isLoggedIn = false;
  isStartingCheckout = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private billingService: BillingService,
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();

    this.http.get<any[]>('http://localhost:3000/api/plans').subscribe({
      next: (data) => this.plans = data,
      error: (err) => console.error('Failed to fetch plans', err)
    });

    if (this.isLoggedIn) {
      this.authService.getProfile().subscribe({
        next: (profile) => {
          this.currentPlan = profile.plan || 'FREE';
        },
        error: (err) => console.error('Failed to fetch profile', err),
      });
    }
  }

  isFeatured(planId: string) {
    return planId === 'PRO';
  }

  getBadge(planId: string) {
    if (planId === 'PRO') return 'Most Popular';
    if (planId === 'BUSINESS') return 'Scale & Brand';
    return '';
  }

  getCtaLabel(planId: string) {
    if (!this.isLoggedIn) {
      if (planId === 'FREE') return 'Get Started Free';
      if (planId === 'PRO') return 'Create Account for Pro';
      return 'Create Account for Business';
    }

    if (planId === 'FREE') return this.currentPlan === 'FREE' ? 'Current Plan' : 'Back to Dashboard';
    if (this.currentPlan === 'FREE') {
      return planId === 'PRO' ? 'Upgrade to Pro' : 'Start Business Plan';
    }

    return 'Manage Billing';
  }

  selectPlan(planId: string) {
    if (!this.isLoggedIn) {
      this.router.navigate(['/register']);
      return;
    }

    if (planId === 'FREE') {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.isStartingCheckout = true;

    const action$ =
      this.currentPlan === 'FREE'
        ? this.billingService.createCheckoutSession(planId as 'PRO' | 'BUSINESS')
        : this.billingService.createPortalSession();

    action$.subscribe({
      next: ({ url }) => {
        window.location.href = url;
      },
      error: (err) => {
        console.error('Failed to start billing flow', err);
        this.isStartingCheckout = false;
      },
    });
  }
}
