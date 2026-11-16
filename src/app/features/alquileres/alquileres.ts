import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Alquiler } from '../../core/models/alquiler';
import { AlquilerService } from '../../core/services/alquiler.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-alquileres',
  imports: [DatePipe, RouterLink],
  templateUrl: './alquileres.html',
  styleUrl: './alquileres.scss',
})
export class Alquileres implements OnInit {
  private readonly alquilerService = inject(AlquilerService);
  protected readonly auth = inject(AuthService);

  protected readonly alquileres = signal<Alquiler[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly accionError = signal<string | null>(null);
  protected readonly devolviendo = signal<string | null>(null);

  protected readonly activos = computed(() =>
    this.alquileres().filter((alquiler) => alquiler.estado === 'activo'),
  );

  protected readonly historial = computed(() =>
    this.alquileres()
      .filter((alquiler) => alquiler.estado === 'devuelto')
      .sort(
        (a, b) =>
          new Date(b.fechaDevolucion ?? b.updatedAt).getTime() -
          new Date(a.fechaDevolucion ?? a.updatedAt).getTime(),
      ),
  );

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.alquilerService.listar().subscribe({
      next: (alquileres) => {
        this.alquileres.set(alquileres);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar tus alquileres.');
        this.cargando.set(false);
      },
    });
  }

  protected devolver(alquiler: Alquiler): void {
    if (!confirm(`¿Confirmas la devolución de "${alquiler.titulo}"?`)) {
      return;
    }

    this.devolviendo.set(alquiler._id);
    this.aviso.set(null);
    this.accionError.set(null);

    this.alquilerService.devolver(alquiler._id).subscribe({
      next: (actualizado) => {
        this.alquileres.update((lista) =>
          lista.map((item) => (item._id === actualizado._id ? actualizado : item)),
        );
        this.devolviendo.set(null);
        this.aviso.set(`Devolviste "${alquiler.titulo}". ¡Gracias!`);
      },
      error: (err) => {
        this.devolviendo.set(null);
        this.accionError.set(err?.error?.message ?? 'No se pudo registrar la devolución.');
      },
    });
  }
}
