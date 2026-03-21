import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'http://localhost:3000/api/admin';

  private get headers() {
    return new HttpHeaders().set('Authorization', `Bearer ${this.auth.token}`);
  }

  getUsers(params: Record<string, string | number>) {
    return this.http.get<any>(`${this.apiUrl}/users`, {
      headers: this.headers,
      params: this.buildParams(params),
    });
  }

  getUser(userId: number) {
    return this.http.get<any>(`${this.apiUrl}/users/${userId}`, {
      headers: this.headers,
    });
  }

  updateUser(userId: number, data: any) {
    return this.http.patch<any>(`${this.apiUrl}/users/${userId}`, data, {
      headers: this.headers,
    });
  }

  getUserLinks(userId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/users/${userId}/links`, {
      headers: this.headers,
    });
  }

  getLinks(params: Record<string, string | number>) {
    return this.http.get<any>(`${this.apiUrl}/links`, {
      headers: this.headers,
      params: this.buildParams(params),
    });
  }

  updateLink(linkId: number, data: any) {
    return this.http.patch<any>(`${this.apiUrl}/links/${linkId}`, data, {
      headers: this.headers,
    });
  }

  deleteLink(linkId: number) {
    return this.http.delete<any>(`${this.apiUrl}/links/${linkId}`, {
      headers: this.headers,
    });
  }

  private buildParams(values: Record<string, string | number>) {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(values)) {
      if (value === '' || value === 'ALL' || value === undefined || value === null) {
        continue;
      }

      params = params.set(key, String(value));
    }

    return params;
  }
}
