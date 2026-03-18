import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class LinksService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'http://localhost:3000/api/links';

  private get headers() {
    return new HttpHeaders().set('Authorization', `Bearer ${this.auth.token}`);
  }

  create(linkData: any) {
    return this.http.post(this.apiUrl, linkData, { headers: this.headers });
  }

  getAll() {
    return this.http.get<any[]>(this.apiUrl, { headers: this.headers });
  }

  update(id: number, data: any) {
    return this.http.patch(`${this.apiUrl}/${id}`, data, { headers: this.headers });
  }

  delete(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.headers });
  }

  verifyPassword(shortCode: string, password: string) {
    return this.http.post<{url: string}>(`http://localhost:3000/s/${shortCode}/verify-password`, { password });
  }

  getLandingPage(shortCode: string) {
    return this.http.get<{
      shortCode: string;
      landingTitle: string;
      landingDescription: string;
      landingButtonLabel: string;
      requiresPassword: boolean;
      hasLandingPage: boolean;
    }>(`http://localhost:3000/api/public/links/${shortCode}/landing`);
  }

  continueFromLanding(shortCode: string) {
    return this.http.post<{url?: string; requiresPassword?: boolean}>(
      `http://localhost:3000/api/public/links/${shortCode}/visit`,
      {},
    );
  }
}
