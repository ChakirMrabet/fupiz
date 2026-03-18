import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.css']
})
export class PricingComponent implements OnInit {
  plans: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>('http://localhost:3000/api/plans').subscribe({
      next: (data) => this.plans = data,
      error: (err) => console.error('Failed to fetch plans', err)
    });
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
    if (planId === 'FREE') return 'Get Started Free';
    if (planId === 'PRO') return 'Upgrade to Pro';
    return 'Start Business Plan';
  }
}
