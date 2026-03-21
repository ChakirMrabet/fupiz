import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './services/auth.service';

export const AdminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return of(false);
  }

  return authService.getProfile().pipe(
    map((profile) => {
      if (profile.role === 'ADMIN') {
        return true;
      }

      router.navigate(['/dashboard']);
      return false;
    }),
    catchError(() => {
      authService.logout();
      router.navigate(['/login']);
      return of(false);
    }),
  );
};
