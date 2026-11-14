import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.autenticado()) {
    return router.createUrlTree(['/login']);
  }

  return auth.esAdmin() ? true : router.createUrlTree(['/libros']);
};
