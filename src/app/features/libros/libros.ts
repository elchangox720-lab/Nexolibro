import { CurrencyPipe } from '@angular/common';
import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { Libro } from '../../core/models/libro';
import { AuthService } from '../../core/services/auth.service';
import { HistorialService } from '../../core/services/historial.service';
import { LibroService } from '../../core/services/libro.service';

@Component({
  selector: 'app-libros',
  imports: [CurrencyPipe],
  templateUrl: './libros.html',
  styleUrl: './libros.scss',
})
export class Libros implements OnInit {
  private readonly libroService = inject(LibroService);
  private readonly auth = inject(AuthService);
  private readonly historialService = inject(HistorialService);

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
  protected readonly tipo = signal('');
  protected readonly seleccionado = signal<Libro | null>(null);

  protected readonly generos = computed(() =>
    [...new Set(this.libros().map((libro) => libro.genero).filter((g): g is string => !!g))].sort(),
  );

  protected readonly tipos = computed(() => {
    const orden = ['Novela', 'Manga', 'Manhwa', 'Cómic'];
    const presentes = new Set(this.libros().map((libro) => libro.tipo).filter((t): t is string => !!t));

    return orden.filter((item) => presentes.has(item));
  });

  protected readonly conteos = computed(() => {
    const mapa = new Map<string, number>();

    for (const libro of this.libros()) {
      if (libro.tipo) {
        mapa.set(libro.tipo, (mapa.get(libro.tipo) ?? 0) + 1);
      }
    }

    return mapa;
  });

  protected readonly filtrados = computed(() => {
    const query = this.busqueda().trim().toLowerCase();
    const genero = this.genero();
    const tipo = this.tipo();

    return this.libros().filter((libro) => {
      const coincideGenero = !genero || libro.genero === genero;
      const coincideTipo = !tipo || libro.tipo === tipo;
      const coincideTexto =
        !query ||
        [libro.titulo, libro.autor, libro.editorial, libro.genero, libro.tipo, libro.isbn].some(
          (valor) => valor?.toLowerCase().includes(query),
        );

      return coincideGenero && coincideTipo && coincideTexto;
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
    this.tipo.set('');
  }

  protected seleccionar(libro: Libro): void {
    this.seleccionado.set(libro);

    if (this.auth.autenticado()) {
      this.historialService.registrar(libro).subscribe({
        error: () => undefined,
      });
    }
  }

  protected cerrar(): void {
    this.seleccionado.set(null);
  }

  @HostListener('document:keydown.escape')
  protected alPresionarEscape(): void {
    this.cerrar();
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
