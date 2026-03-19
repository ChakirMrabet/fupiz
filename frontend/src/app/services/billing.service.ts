import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'http://localhost:3000/api/billing';

  private get headers() {
    return new HttpHeaders().set('Authorization', `Bearer ${this.auth.token}`);
  }

  createCheckoutSession(planId: 'PRO' | 'BUSINESS') {
    return this.http.post<{ url: string }>(
      `${this.apiUrl}/checkout`,
      { planId },
      { headers: this.headers },
    );
  }

  createPortalSession() {
    return this.http.post<{ url: string }>(
      `${this.apiUrl}/portal`,
      {},
      { headers: this.headers },
    );
  }
}
