import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  getUsers(search = '') {
    return this.http.get<any[]>(`${this.apiUrl}/users`, {
      headers: this.headers,
      params: search ? { search } : {},
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

  updateLink(linkId: number, data: any) {
    return this.http.patch<any>(`${this.apiUrl}/links/${linkId}`, data, {
      headers: this.headers,
    });
  }
}
