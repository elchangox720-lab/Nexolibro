import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { HistorialItem } from '../../core/models/historial';
import { AuthService } from '../../core/services/auth.service';
import { HistorialService } from '../../core/services/historial.service';

@Component({
  selector: 'app-historial',
  imports: [DatePipe],
  templateUrl: './historial.html',
})
export class Historial implements OnInit {
  private readonly historialService = inject(HistorialService);
  protected readonly auth = inject(AuthService);

  protected readonly items = signal<HistorialItem[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.historialService.listar().subscribe({
      next: (items) => {
        this.items.set(items);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar tu historial.');
        this.cargando.set(false);
      },
    });
  }

  protected limpiar(): void {
    if (!this.items().length) {
      return;
    }

    if (!confirm('¿Borrar todo tu historial de navegación?')) {
      return;
    }

    this.historialService.limpiar().subscribe({
      next: () => this.items.set([]),
    });
  }

  protected quitar(id: string): void {
    this.historialService.eliminar(id).subscribe({
      next: () => this.items.update((lista) => lista.filter((item) => item._id !== id)),
    });
  }
}
