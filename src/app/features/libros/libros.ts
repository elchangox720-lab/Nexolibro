import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { retry, throwError, timer } from 'rxjs';
import { Alquiler, RespuestaAlquiler } from '../../core/models/alquiler';
import { EstadoLectura } from '../../core/models/biblioteca';
import { Libro } from '../../core/models/libro';
import { Resena } from '../../core/models/resena';
import { AlquilerService } from '../../core/services/alquiler.service';
import { AuthService } from '../../core/services/auth.service';
import { BibliotecaService } from '../../core/services/biblioteca.service';
import { CatalogoService } from '../../core/services/catalogo.service';
import { HistorialService } from '../../core/services/historial.service';
import { LibroService } from '../../core/services/libro.service';
import { ResenaService } from '../../core/services/resena.service';

@Component({
  selector: 'app-libros',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, FormsModule, RouterLink],
  templateUrl: './libros.html',
  styleUrl: './libros.scss',
})
export class Libros implements OnInit {
  private readonly libroService = inject(LibroService);
  private readonly historialService = inject(HistorialService);
  private readonly bibliotecaService = inject(BibliotecaService);
  private readonly resenaService = inject(ResenaService);
  private readonly alquilerService = inject(AlquilerService);
  private readonly catalogo = inject(CatalogoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly auth = inject(AuthService);

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

  protected readonly favoritos = signal<Set<string>>(new Set());
  protected readonly estados = signal<Map<string, EstadoLectura>>(new Map());
  protected readonly soloFavoritos = signal(false);
  protected readonly estadoFiltro = signal<'' | EstadoLectura>('');

  protected readonly alquileresActivos = signal<Map<string, Alquiler>>(new Map());
  protected readonly procesandoAlquiler = signal<string | null>(null);
  protected readonly alquilerAviso = signal<string | null>(null);
  protected readonly alquilerError = signal<string | null>(null);
  protected readonly pidiendoCedula = signal(false);
  protected cedula = '';

  private cedulaConocida = '';

  protected readonly resenas = signal<Resena[]>([]);
  protected readonly promedio = signal(0);
  protected readonly total = signal(0);
  protected readonly calificacion = signal(0);
  protected comentario = '';
  protected readonly enviandoResena = signal(false);
  protected readonly resenaError = signal<string | null>(null);

  protected readonly generos = computed(() =>
    [
      ...new Set(
        this.libros()
          .map((libro) => libro.genero)
          .filter((g): g is string => !!g),
      ),
    ].sort(),
  );

  protected readonly tipos = computed(() => {
    const orden = ['Novela', 'Manga', 'Manhwa', 'Cómic'];
    const presentes = new Set(
      this.libros()
        .map((libro) => libro.tipo)
        .filter((t): t is string => !!t),
    );

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

  protected readonly miResena = computed(() => {
    const usuarioId = this.auth.usuario()?._id;
    return usuarioId
      ? (this.resenas().find((resena) => resena.usuario?._id === usuarioId) ?? null)
      : null;
  });

  protected readonly promedioEntero = computed(() => Math.round(this.promedio()));

  protected readonly hayFiltros = computed(
    () =>
      !!this.busqueda() ||
      !!this.genero() ||
      !!this.tipo() ||
      this.soloFavoritos() ||
      !!this.estadoFiltro(),
  );

  protected readonly filtrados = computed(() => {
    const query = this.busqueda().trim().toLowerCase();
    const genero = this.genero();
    const tipo = this.tipo();
    const soloFavoritos = this.soloFavoritos();
    const estadoFiltro = this.estadoFiltro();
    const favoritos = this.favoritos();
    const estados = this.estados();

    return this.libros().filter((libro) => {
      const coincideGenero = !genero || libro.genero === genero;
      const coincideTipo = !tipo || libro.tipo === tipo;
      const coincideFavorito = !soloFavoritos || favoritos.has(libro._id);
      const coincideEstado = !estadoFiltro || estados.get(libro._id) === estadoFiltro;
      const coincideTexto =
        !query ||
        [libro.titulo, libro.autor, libro.editorial, libro.genero, libro.tipo, libro.isbn].some(
          (valor) => valor?.toLowerCase().includes(query),
        );

      return coincideGenero && coincideTipo && coincideFavorito && coincideEstado && coincideTexto;
    });
  });

  ngOnInit(): void {
    this.cargar();
    this.cargarBiblioteca();
    this.cargarAlquileres();

    this.catalogo.reinicios$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.limpiarFiltros();
      this.cerrar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.libroService
      .listar()
      .pipe(
        retry({
          count: 3,
          delay: (error, intento) => {
            const status = Number(error?.status ?? 0);

            if (status >= 400 && status < 500 && status !== 429) {
              return throwError(() => error);
            }

            return timer(intento * 1500);
          },
        }),
      )
      .subscribe({
        next: (libros) => {
          this.libros.set(libros);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set(
            'No se pudieron cargar los libros. El servidor puede estar iniciando; pulsa Reintentar.',
          );
          this.cargando.set(false);
        },
      });
  }

  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.genero.set('');
    this.tipo.set('');
    this.soloFavoritos.set(false);
    this.estadoFiltro.set('');
  }

  protected esFavorito(libro: Libro): boolean {
    return this.favoritos().has(libro._id);
  }

  protected estadoDe(libro: Libro): EstadoLectura | null {
    return this.estados().get(libro._id) ?? null;
  }

  protected etiquetaEstado(estado: EstadoLectura | null): string {
    switch (estado) {
      case 'quiero-leer':
        return 'Quiero leer';
      case 'leyendo':
        return 'Leyendo';
      case 'leido':
        return 'Leído';
      default:
        return '';
    }
  }

  protected alternarFavorito(libro: Libro, evento?: Event): void {
    evento?.stopPropagation();

    if (!this.auth.autenticado()) {
      this.router.navigate(['/login']);
      return;
    }

    const activo = this.favoritos().has(libro._id);
    const siguiente = new Set(this.favoritos());

    if (activo) {
      siguiente.delete(libro._id);
    } else {
      siguiente.add(libro._id);
    }

    this.favoritos.set(siguiente);

    this.bibliotecaService.actualizar(libro._id, { favorito: !activo }).subscribe({
      error: () => {
        const revertido = new Set(this.favoritos());
        if (activo) {
          revertido.add(libro._id);
        } else {
          revertido.delete(libro._id);
        }
        this.favoritos.set(revertido);
      },
    });
  }

  protected cambiarEstado(libro: Libro, valor: string, evento?: Event): void {
    evento?.stopPropagation();

    if (!this.auth.autenticado()) {
      this.router.navigate(['/login']);
      return;
    }

    const estado = (valor || null) as EstadoLectura | null;
    const siguiente = new Map(this.estados());

    if (estado) {
      siguiente.set(libro._id, estado);
    } else {
      siguiente.delete(libro._id);
    }

    this.estados.set(siguiente);

    this.bibliotecaService.actualizar(libro._id, { estado }).subscribe({
      error: () => this.cargarBiblioteca(),
    });
  }

  protected alquilerActivo(libro: Libro): Alquiler | null {
    const alquiler = this.alquileresActivos().get(libro._id) ?? null;

    if (alquiler?.estado === 'pendiente_pago' && !alquiler.checkoutUrl) {
      return null;
    }

    return alquiler;
  }

  protected pedirCedula(libro: Libro, evento?: Event): void {
    evento?.stopPropagation();

    if (!this.auth.autenticado()) {
      this.router.navigate(['/login']);
      return;
    }

    const existente = this.alquilerActivo(libro);

    if (existente?.estado === 'pendiente_pago') {
      this.abrirCheckout(existente, evento);
      return;
    }

    if (existente) {
      this.alquilerError.set('Ya tienes un alquiler activo de este libro.');
      return;
    }

    if (libro.stock < 1) {
      this.alquilerError.set('No hay ejemplares disponibles de este libro.');
      return;
    }

    if (this.seleccionado()?._id !== libro._id) {
      this.seleccionar(libro);
    }

    this.cedula = this.cedulaConocida;
    this.pidiendoCedula.set(true);
    this.alquilerAviso.set(null);
    this.alquilerError.set(null);
  }

  protected abrirCheckout(alquiler: Alquiler, evento?: Event): void {
    evento?.stopPropagation();

    if (!alquiler.checkoutUrl) {
      this.alquilerError.set(
        'El enlace de pago expiró. Vuelve a intentar el alquiler para generar uno nuevo.',
      );
      return;
    }

    window.location.assign(alquiler.checkoutUrl);
  }

  protected confirmarAlquiler(libro: Libro): void {
    const cedula = this.cedula.trim().replace(/[.\s-]/g, '');

    if (!/^\d{6,10}$/.test(cedula)) {
      this.alquilerError.set('Ingresa un número de cédula válido, entre 6 y 10 dígitos.');
      return;
    }

    this.procesandoAlquiler.set(libro._id);
    this.alquilerAviso.set(null);
    this.alquilerError.set(null);

    this.alquilerService.alquilar(libro._id, cedula).subscribe({
      next: (respuesta: RespuestaAlquiler) => {
        const alquiler = respuesta.alquiler;
        const activos = new Map(this.alquileresActivos());
        activos.set(libro._id, alquiler);
        this.alquileresActivos.set(activos);
        this.cedulaConocida = cedula;
        this.cedula = '';
        this.pidiendoCedula.set(false);
        this.procesandoAlquiler.set(null);

        if (!respuesta.reutilizado) {
          this.cambiarStockLibro(libro._id, -1);
        }

        if (respuesta.checkoutUrl) {
          this.alquilerAviso.set(
            `Reservamos "${libro.titulo}". Completa el pago de ${alquiler.tarifa.toLocaleString('es-CO')} COP para activar el alquiler.`,
          );
          window.location.assign(respuesta.checkoutUrl);
          return;
        }

        if (alquiler.estado === 'pendiente_pago') {
          this.alquilerAviso.set('El pago aún no ha sido confirmado. Consulta tus alquileres.');
          return;
        }

        if (alquiler.lecturaDisponible) {
          this.cerrar();
          this.router.navigate(['/lector', alquiler._id]);
        } else {
          this.alquilerAviso.set(
            `Alquiler registrado por ${alquiler.dias} días. Archivo de lectura no disponible para este libro.`,
          );
        }
      },
      error: (err) => {
        this.procesandoAlquiler.set(null);
        this.alquilerError.set(err?.error?.message ?? 'No se pudo registrar el alquiler.');
      },
    });
  }

  protected irALogin(): void {
    this.router.navigate(['/login']);
  }

  protected devolverAlquiler(libro: Libro, evento?: Event): void {
    evento?.stopPropagation();

    const alquiler = this.alquilerActivo(libro);
    if (!alquiler) {
      return;
    }

    if (alquiler.estado === 'pendiente_pago') {
      this.abrirCheckout(alquiler, evento);
      return;
    }

    if (!confirm(`¿Confirmas la devolución de "${libro.titulo}"?`)) {
      return;
    }

    this.procesandoAlquiler.set(libro._id);
    this.alquilerAviso.set(null);
    this.alquilerError.set(null);

    this.alquilerService.devolver(alquiler._id).subscribe({
      next: () => {
        const activos = new Map(this.alquileresActivos());
        activos.delete(libro._id);
        this.alquileresActivos.set(activos);
        this.cambiarStockLibro(libro._id, 1);
        this.procesandoAlquiler.set(null);
        this.alquilerAviso.set('Devolución registrada. ¡Gracias!');
      },
      error: (err) => {
        this.procesandoAlquiler.set(null);
        this.alquilerError.set(err?.error?.message ?? 'No se pudo registrar la devolución.');
      },
    });
  }

  protected abrirLector(alquiler: Alquiler, evento?: Event): void {
    evento?.stopPropagation();

    if (alquiler.estado === 'pendiente_pago') {
      this.abrirCheckout(alquiler, evento);
      return;
    }

    if (alquiler.vencido) {
      this.alquilerError.set('Tu alquiler venció. El archivo de lectura ya no está disponible.');
      return;
    }

    if (!alquiler.lecturaDisponible) {
      this.alquilerError.set('Archivo de lectura no disponible para este libro.');
      return;
    }

    this.router.navigate(['/lector', alquiler._id]);
  }

  protected seleccionar(libro: Libro): void {
    this.seleccionado.set(libro);
    this.pidiendoCedula.set(false);
    this.cedula = '';
    this.alquilerAviso.set(null);
    this.alquilerError.set(null);
    this.cargarResenas(libro._id);

    if (this.auth.autenticado()) {
      this.historialService.registrar(libro).subscribe({
        error: () => undefined,
      });
    }
  }

  protected cerrar(): void {
    this.seleccionado.set(null);
    this.pidiendoCedula.set(false);
    this.cedula = '';
  }

  protected enviarResena(libro: Libro): void {
    if (this.calificacion() < 1) {
      this.resenaError.set('Elige una calificación de 1 a 5 estrellas.');
      return;
    }

    this.enviandoResena.set(true);
    this.resenaError.set(null);

    this.resenaService
      .guardar(libro._id, {
        calificacion: this.calificacion(),
        comentario: this.comentario.trim(),
      })
      .subscribe({
        next: () => {
          this.enviandoResena.set(false);
          this.cargarResenas(libro._id);
        },
        error: (err) => {
          this.enviandoResena.set(false);
          this.resenaError.set(err?.error?.message ?? 'No se pudo guardar tu reseña.');
        },
      });
  }

  protected eliminarMiResena(libro: Libro): void {
    if (!confirm('¿Eliminar tu reseña de este libro?')) {
      return;
    }

    this.resenaService.eliminar(libro._id).subscribe({
      next: () => {
        this.calificacion.set(0);
        this.comentario = '';
        this.cargarResenas(libro._id);
      },
      error: (err) => {
        this.resenaError.set(err?.error?.message ?? 'No se pudo eliminar tu reseña.');
      },
    });
  }

  protected estrellas(valor: number): string {
    const llenas = Math.max(0, Math.min(5, Math.round(valor)));
    return '★'.repeat(llenas) + '☆'.repeat(5 - llenas);
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

  private cargarBiblioteca(): void {
    if (!this.auth.autenticado()) {
      return;
    }

    this.bibliotecaService.listar().subscribe({
      next: (items) => {
        const favoritos = new Set<string>();
        const estados = new Map<string, EstadoLectura>();

        for (const item of items) {
          if (item.favorito) {
            favoritos.add(item.libro);
          }
          if (item.estado) {
            estados.set(item.libro, item.estado);
          }
        }

        this.favoritos.set(favoritos);
        this.estados.set(estados);
      },
      error: () => undefined,
    });
  }

  private cargarAlquileres(): void {
    if (!this.auth.autenticado()) {
      return;
    }

    this.alquilerService.listar().subscribe({
      next: (alquileres) => {
        const activos = new Map<string, Alquiler>();
        for (const alquiler of alquileres) {
          if (alquiler.estado === 'activo' || alquiler.estado === 'pendiente_pago') {
            activos.set(alquiler.libro, alquiler);
          }
        }
        this.alquileresActivos.set(activos);
        const conocida = alquileres.find((alquiler) => alquiler.cedula)?.cedula;
        if (conocida) {
          this.cedulaConocida = conocida;
        }
      },
      error: () => undefined,
    });
  }

  private cambiarStockLibro(libroId: string, delta: number): void {
    const actualizar = (libro: Libro): Libro =>
      libro._id === libroId ? { ...libro, stock: Math.max(0, libro.stock + delta) } : libro;

    this.libros.update((libros) => libros.map(actualizar));
    this.seleccionado.update((libro) => (libro ? actualizar(libro) : null));
  }

  private cargarResenas(libroId: string): void {
    this.resenas.set([]);
    this.promedio.set(0);
    this.total.set(0);
    this.calificacion.set(0);
    this.comentario = '';
    this.resenaError.set(null);

    this.resenaService.listar(libroId).subscribe({
      next: (data) => {
        if (this.seleccionado()?._id !== libroId) {
          return;
        }

        this.resenas.set(data.resenas);
        this.promedio.set(data.promedio);
        this.total.set(data.total);

        const usuarioId = this.auth.usuario()?._id;
        const propia = data.resenas.find((resena) => resena.usuario?._id === usuarioId);

        if (propia) {
          this.calificacion.set(propia.calificacion);
          this.comentario = propia.comentario ?? '';
        }
      },
      error: () => {
        if (this.seleccionado()?._id === libroId) {
          this.resenaError.set('No se pudieron cargar las reseñas.');
        }
      },
    });
  }
}
