import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio),
  },
  {
    path: 'libros',
    loadComponent: () => import('./features/libros/libros').then((m) => m.Libros),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    loadComponent: () => import('./features/auth/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'alquileres',
    canActivate: [authGuard],
    loadComponent: () => import('./features/alquileres/alquileres').then((m) => m.Alquileres),
  },
  {
    path: 'lector/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/lector/lector').then((m) => m.Lector),
  },
  {
    path: 'historial',
    canActivate: [authGuard],
    loadComponent: () => import('./features/historial/historial').then((m) => m.Historial),
  },
  {
    path: 'pago/resultado/:referencia',
    loadComponent: () =>
      import('./features/pago-resultado/pago-resultado').then((m) => m.PagoResultado),
  },
  {
    path: 'admin/alquileres',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin-alquileres/admin-alquileres').then((m) => m.AdminAlquileres),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin').then((m) => m.Admin),
  },
  { path: '**', redirectTo: '' },
];
