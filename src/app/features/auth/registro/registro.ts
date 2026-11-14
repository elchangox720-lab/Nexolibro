import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink],
  templateUrl: './registro.html',
})
export class Registro {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected nombre = '';
  protected email = '';
  protected password = '';
  protected confirmar = '';
  protected readonly error = signal<string | null>(null);
  protected readonly cargando = signal(false);

  protected enviar(): void {
    if (!this.nombre.trim() || !this.email.trim() || !this.password || !this.confirmar) {
      this.error.set('Completa todos los campos.');
      return;
    }

    if (this.password.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (this.password !== this.confirmar) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.auth
      .registrar({
        nombre: this.nombre.trim(),
        email: this.email.trim(),
        password: this.password,
      })
      .subscribe({
        next: () => this.router.navigate(['/libros']),
        error: (err) => {
          this.error.set(err?.error?.message ?? 'No se pudo crear la cuenta.');
          this.cargando.set(false);
        },
      });
  }
}
