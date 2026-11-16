import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Alquiler } from '../../core/models/alquiler';
import { AlquilerService } from '../../core/services/alquiler.service';

type Filtro = 'activos' | 'vencidos' | 'devueltos' | 'todos';

@Component({
  selector: 'app-admin-alquileres',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './admin-alquileres.html',
  styleUrl: './admin-alquileres.scss',
})
export class AdminAlquileres implements OnInit {
  private readonly alquilerService = inject(AlquilerService);

  protected readonly alquileres = signal<Alquiler[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly accionError = signal<string | null>(null);
  protected readonly devolviendo = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly filtro = signal<Filtro>('activos');

  protected readonly resumen = computed(() => {
    const lista = this.alquileres();
    return {
      activos: lista.filter((alquiler) => alquiler.estado === 'activo').length,
      vencidos: lista.filter((alquiler) => alquiler.estado === 'activo' && alquiler.vencido).length,
      devueltos: lista.filter((alquiler) => alquiler.estado === 'devuelto').length,
      todos: lista.length,
    };
  });

  protected readonly filtrados = computed(() => {
    const query = this.busqueda().trim().toLowerCase();
    let lista = this.alquileres();

    switch (this.filtro()) {
      case 'activos':
        lista = lista.filter((alquiler) => alquiler.estado === 'activo');
        break;
      case 'vencidos':
        lista = lista.filter((alquiler) => alquiler.estado === 'activo' && alquiler.vencido);
        break;
      case 'devueltos':
        lista = lista.filter((alquiler) => alquiler.estado === 'devuelto');
        break;
      default:
        break;
    }

    if (!query) {
      return lista;
    }

    return lista.filter((alquiler) => {
      const usuario = this.datosUsuario(alquiler);
      return [
        alquiler.titulo,
        alquiler.autor,
        alquiler.cedula,
        usuario?.nombre,
        usuario?.email,
      ].some((valor) => valor?.toLowerCase().includes(query));
    });
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.alquilerService.listarAdmin().subscribe({
      next: (alquileres) => {
        this.alquileres.set(alquileres);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los alquileres.');
        this.cargando.set(false);
      },
    });
  }

  protected devolver(alquiler: Alquiler): void {
    if (!confirm(`¿Registrar la devolución de "${alquiler.titulo}"?`)) {
      return;
    }

    this.devolviendo.set(alquiler._id);
    this.aviso.set(null);
    this.accionError.set(null);

    this.alquilerService.devolverAdmin(alquiler._id).subscribe({
      next: (actualizado) => {
        this.alquileres.update((lista) =>
          lista.map((item) => (item._id === actualizado._id ? { ...item, ...actualizado } : item)),
        );
        this.devolviendo.set(null);
        this.aviso.set('Devolución registrada.');
      },
      error: (err) => {
        this.devolviendo.set(null);
        this.accionError.set(err?.error?.message ?? 'No se pudo registrar la devolución.');
      },
    });
  }

  protected datosUsuario(alquiler: Alquiler): { nombre: string; email: string } | null {
    return alquiler.usuario && typeof alquiler.usuario === 'object'
      ? { nombre: alquiler.usuario.nombre, email: alquiler.usuario.email }
      : null;
  }
}
