import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './services/auth.service';

export const AuthGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    // The dashboard shell should only open after the backend confirms the token is
    // still valid for a real account, not just because localStorage contains a string.
    return authService.getProfile().pipe(
      map(() => true),
      catchError(() => {
        authService.logout();
        router.navigate(['/login']);
        return of(false);
      }),
    );
  }

  router.navigate(['/login']);
  return false;
};
