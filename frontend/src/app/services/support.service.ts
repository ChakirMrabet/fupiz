import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class SupportService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly backendUrl = 'http://localhost:3000/api';

  private get authHeaders() {
    return new HttpHeaders().set('Authorization', `Bearer ${this.authService.token}`);
  }

  submitPublicContact(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    return this.http.post<{ message: string }>(`${this.backendUrl}/public/contact`, data);
  }

  submitDashboardSupport(data: {
    subject: string;
    category: string;
    message: string;
  }) {
    return this.http.post<{ message: string }>(`${this.backendUrl}/support`, data, {
      headers: this.authHeaders,
    });
  }
}
