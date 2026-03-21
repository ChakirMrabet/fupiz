import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LinksService } from '../../services/links.service';

@Component({
  selector: 'app-go',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './go.component.html',
  styleUrls: ['./go.component.css']
})
export class GoComponent implements OnInit {
  shortCode = '';
  isLoading = true;
  isContinuing = false;
  errorMsg = '';
  landingTitle = '';
  landingDescription = '';
  landingButtonLabel = 'Continue';
  requiresPassword = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private linksService: LinksService,
  ) {}

  ngOnInit() {
    this.shortCode = this.route.snapshot.paramMap.get('shortCode') || '';
    const errorParam = this.route.snapshot.queryParamMap.get('error');
    if (!this.shortCode) {
      this.isLoading = false;
      this.errorMsg = 'Invalid link.';
      return;
    }

    if (errorParam === 'notfound') {
      this.isLoading = false;
      this.errorMsg = 'This link was not found or is deactivated.';
      return;
    }
    if (errorParam === 'expired') {
      this.isLoading = false;
      this.errorMsg = 'This link has expired.';
      return;
    }

    this.linksService.getLandingPage(this.shortCode).subscribe({
      next: (data) => {
        this.isLoading = false;
        this.landingTitle = data.landingTitle;
        this.landingDescription = data.landingDescription;
        this.landingButtonLabel = data.landingButtonLabel;
        this.requiresPassword = data.requiresPassword;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message || 'This link is unavailable.';
      }
    });
  }

  continueVisit() {
    if (!this.shortCode || this.isContinuing) return;

    if (this.requiresPassword) {
      this.router.navigate(['/unlock', this.shortCode]);
      return;
    }

    this.isContinuing = true;
    this.linksService.continueFromLanding(this.shortCode).subscribe({
      next: (res) => {
        if (res.requiresPassword) {
          this.router.navigate(['/unlock', this.shortCode]);
          return;
        }

        if (res.url) {
          window.location.href = res.url;
          return;
        }

        this.isContinuing = false;
        this.errorMsg = 'Unable to continue.';
      },
      error: (err) => {
        this.isContinuing = false;
        this.errorMsg = err.error?.message || 'This link is unavailable.';
      }
    });
  }
}
