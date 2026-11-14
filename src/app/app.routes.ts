import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'libros',
    loadComponent: () => import('./features/libros/libros').then((m) => m.Libros),
  },
  { path: '', pathMatch: 'full', redirectTo: 'libros' },
  { path: '**', redirectTo: 'libros' },
];
