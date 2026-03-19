import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class LinksService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private backendUrl = 'http://localhost:3000';
  private apiUrl = `${this.backendUrl}/api/links`;

  private get headers() {
    return new HttpHeaders().set('Authorization', `Bearer ${this.auth.token}`);
  }

  create(linkData: any) {
    return this.http.post(this.apiUrl, linkData, { headers: this.headers });
  }

  createAnonymous(linkData: { originalUrl: string }) {
    return this.http.post<{
      shortCode: string;
      shortUrl: string;
      originalUrl: string;
    }>(`${this.backendUrl}/api/public/links`, linkData);
  }

  bulkCreate(entries: any[]) {
    return this.http.post<{
      createdCount: number;
      failedCount: number;
      results: Array<{ index: number; success: boolean; link?: any; error?: string }>;
    }>(`${this.apiUrl}/bulk`, { entries }, { headers: this.headers });
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

  getWebhooks() {
    return this.http.get<any[]>(`${this.backendUrl}/api/webhooks`, { headers: this.headers });
  }

  createWebhook(data: any) {
    return this.http.post<any>(`${this.backendUrl}/api/webhooks`, data, { headers: this.headers });
  }

  updateWebhook(id: number, data: any) {
    return this.http.patch<any>(`${this.backendUrl}/api/webhooks/${id}`, data, { headers: this.headers });
  }

  deleteWebhook(id: number) {
    return this.http.delete(`${this.backendUrl}/api/webhooks/${id}`, { headers: this.headers });
  }

  verifyPassword(shortCode: string, password: string) {
    return this.http.post<{url: string}>(`${this.backendUrl}/s/${shortCode}/verify-password`, { password });
  }

  getLandingPage(shortCode: string) {
    return this.http.get<{
      shortCode: string;
      landingTitle: string;
      landingDescription: string;
      landingButtonLabel: string;
      requiresPassword: boolean;
      hasLandingPage: boolean;
    }>(`${this.backendUrl}/api/public/links/${shortCode}/landing`);
  }

  continueFromLanding(shortCode: string) {
    return this.http.post<{url?: string; requiresPassword?: boolean}>(
      `${this.backendUrl}/api/public/links/${shortCode}/visit`,
      {},
    );
  }
}
