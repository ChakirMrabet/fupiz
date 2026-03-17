import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-activate-account',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './activate-account.component.html',
  styleUrl: './activate-account.component.css'
})
export class ActivateAccountComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  isLoading = true;
  isSuccess = false;
  title = 'Activating Account';
  message = 'Please wait while we verify your activation link.';

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.isLoading = false;
      this.title = 'Invalid Activation Link';
      this.message = 'The activation token is missing or malformed.';
      return;
    }

    this.authService.activateAccount(token).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isSuccess = response.status === 'activated' || response.status === 'already_active';
        this.title = this.isSuccess ? 'Account Ready' : 'Activation Failed';
        this.message = response.message;
      },
      error: (err) => {
        this.isLoading = false;
        this.title = 'Activation Failed';
        this.message = err.error?.message || 'The activation link is invalid or expired.';
      }
    });
  }
}
