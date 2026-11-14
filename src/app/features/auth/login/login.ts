import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected email = '';
  protected password = '';
  protected readonly error = signal<string | null>(null);
  protected readonly cargando = signal(false);

  protected enviar(): void {
    if (!this.email.trim() || !this.password) {
      this.error.set('Completa todos los campos.');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.auth.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: () => this.router.navigate(['/libros']),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se pudo iniciar sesión.');
        this.cargando.set(false);
      },
    });
  }
}
