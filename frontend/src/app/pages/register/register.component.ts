import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  email = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  errorMsg = '';
  successMsg = '';

  constructor(
    private auth: AuthService,
  ) {}

  onSubmit() {
    if (this.password !== this.confirmPassword) {
      this.errorMsg = 'Passwords do not match';
      return;
    }

    this.isLoading = true;
    this.errorMsg = '';
    this.successMsg = '';

    this.auth.register({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMsg = response.message;
        this.password = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message || 'Registration failed';
      }
    });
  }
}
