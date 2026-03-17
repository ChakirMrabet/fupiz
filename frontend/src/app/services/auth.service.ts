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
    return !!this.token;
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
}
