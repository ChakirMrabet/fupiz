import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LinksService } from '../../services/links.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  email = '';
  password = '';
  isLoading = false;
  errorMsg = '';
  pendingUrl = '';

  constructor(
    private auth: AuthService, 
    private router: Router,
    private route: ActivatedRoute,
    private linksService: LinksService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['url']) {
        this.pendingUrl = params['url'];
      }
    });
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMsg = '';
    this.auth.register({ email: this.email, password: this.password }).subscribe({
      next: () => {
        if (this.pendingUrl) {
          this.linksService.create({ originalUrl: this.pendingUrl }).subscribe({
            next: () => this.router.navigate(['/dashboard']),
            error: () => this.router.navigate(['/dashboard'])
          });
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message || 'Registration failed';
      }
    });
  }
}
