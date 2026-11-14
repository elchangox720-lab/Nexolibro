import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Libro } from '../../core/models/libro';
import { LibroService } from '../../core/services/libro.service';

@Component({
  selector: 'app-libros',
  imports: [CurrencyPipe],
  templateUrl: './libros.html',
  styleUrl: './libros.scss',
})
export class Libros implements OnInit {
  private readonly libroService = inject(LibroService);

  private readonly paletas = [
    'linear-gradient(135deg, #7c3aed, #2563eb)',
    'linear-gradient(135deg, #b45309, #d97706)',
    'linear-gradient(135deg, #0f766e, #0d9488)',
    'linear-gradient(135deg, #be185d, #db2777)',
    'linear-gradient(135deg, #4338ca, #6d28d9)',
    'linear-gradient(135deg, #9a3412, #ea580c)',
    'linear-gradient(135deg, #4c1d95, #9333ea)',
    'linear-gradient(135deg, #065f46, #059669)',
  ];

  protected readonly libros = signal<Libro[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly genero = signal('');

  protected readonly generos = computed(() =>
    [...new Set(this.libros().map((libro) => libro.genero).filter((g): g is string => !!g))].sort(),
  );

  protected readonly filtrados = computed(() => {
    const query = this.busqueda().trim().toLowerCase();
    const genero = this.genero();

    return this.libros().filter((libro) => {
      const coincideGenero = !genero || libro.genero === genero;
      const coincideTexto =
        !query ||
        [libro.titulo, libro.autor, libro.editorial, libro.genero, libro.isbn].some((valor) =>
          valor?.toLowerCase().includes(query),
        );

      return coincideGenero && coincideTexto;
    });
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.libroService.listar().subscribe({
      next: (libros) => {
        this.libros.set(libros);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los libros. Revisa que el backend esté en línea.');
        this.cargando.set(false);
      },
    });
  }

  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.genero.set('');
  }

  protected portada(libro: Libro): string {
    const base = libro._id || libro.titulo;
    let hash = 0;

    for (let i = 0; i < base.length; i++) {
      hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
    }

    return this.paletas[hash % this.paletas.length];
  }
}
