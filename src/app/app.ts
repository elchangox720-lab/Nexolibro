import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { CatalogoService } from './core/services/catalogo.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly catalogo = inject(CatalogoService);

  protected readonly enInicio = toSignal(
    this.router.events.pipe(
      filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
      map((evento) => evento.urlAfterRedirects === '/'),
      startWith(this.router.url === '/'),
    ),
    { initialValue: this.router.url === '/' },
  );

  protected abrirCatalogo(): void {
    this.catalogo.solicitarReinicio();
  }

  protected cerrarSesion(): void {
    this.auth.logout();
    this.router.navigate(['/libros']);
  }
}
