import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/auth';
  
  private tokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('token'));
  public token$ = this.tokenSubject.asObservable();

  get token() {
    return this.tokenSubject.value;
  }

  isLoggedIn() {
    // Frontend guards should reject obviously expired tokens before rendering
    // protected shells, even though the backend remains the source of truth.
    if (!this.token) {
      return false;
    }

    if (this.isTokenExpired(this.token)) {
      this.logout();
      return false;
    }

    return true;
  }

  login(credentials: any) {
    return this.http.post<{access_token: string}>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem('token', res.access_token);
        this.tokenSubject.next(res.access_token);
      })
    );
  }

  register(data: any) {
    return this.http.post<{message: string}>(`${this.apiUrl}/register`, data);
  }

  activateAccount(token: string) {
    return this.http.post<{message: string; status: string}>(`${this.apiUrl}/activate`, { token });
  }

  getProfile() {
    return this.http.get<any>(`http://localhost:3000/api/users/me`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
  }

  updateProfile(data: any) {
    return this.http.patch<any>(`http://localhost:3000/api/users/me`, data, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
  }

  logout() {
    localStorage.removeItem('token');
    this.tokenSubject.next(null);
  }

  private isTokenExpired(token: string) {
    try {
      const [, payload] = token.split('.');
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(
        normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
        '=',
      );
      const decodedPayload = JSON.parse(atob(paddedPayload));

      if (!decodedPayload?.exp) {
        return false;
      }

      return Date.now() >= decodedPayload.exp * 1000;
    } catch {
      return true;
    }
  }
}
