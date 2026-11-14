import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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

  protected abrirCatalogo(): void {
    this.catalogo.solicitarReinicio();
  }

  protected cerrarSesion(): void {
    this.auth.logout();
    this.router.navigate(['/libros']);
  }
}
