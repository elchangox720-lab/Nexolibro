import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Libro, LibroInput } from '../../core/models/libro';
import { LibroService } from '../../core/services/libro.service';

@Component({
  selector: 'app-admin',
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin implements OnInit {
  private readonly libroService = inject(LibroService);

  protected readonly tipos = ['Novela', 'Manga', 'Manhwa', 'Cómic'];

  protected readonly libros = signal<Libro[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly formularioAbierto = signal(false);
  protected readonly guardando = signal(false);
  protected readonly editando = signal<Libro | null>(null);
  protected readonly formError = signal<string | null>(null);

  protected formulario: LibroInput = this.vacio();

  protected readonly filtrados = computed(() => {
    const query = this.busqueda().trim().toLowerCase();

    if (!query) {
      return this.libros();
    }

    return this.libros().filter((libro) =>
      [libro.titulo, libro.autor, libro.genero, libro.tipo, libro.isbn].some((valor) =>
        valor?.toLowerCase().includes(query),
      ),
    );
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
        this.error.set('No se pudieron cargar los libros.');
        this.cargando.set(false);
      },
    });
  }

  protected nuevo(): void {
    this.editando.set(null);
    this.formulario = this.vacio();
    this.formError.set(null);
    this.formularioAbierto.set(true);
  }

  protected editar(libro: Libro): void {
    this.editando.set(libro);
    this.formulario = {
      titulo: libro.titulo,
      autor: libro.autor,
      tipo: libro.tipo ?? 'Novela',
      genero: libro.genero ?? '',
      anio: libro.anio,
      editorial: libro.editorial ?? '',
      isbn: libro.isbn ?? '',
      precio: libro.precio,
      stock: libro.stock,
      portada: libro.portada ?? '',
      descripcion: libro.descripcion ?? '',
    };
    this.formError.set(null);
    this.formularioAbierto.set(true);
  }

  protected cerrarFormulario(): void {
    this.formularioAbierto.set(false);
    this.formError.set(null);
  }

  protected guardar(): void {
    const titulo = this.formulario.titulo?.trim();
    const autor = this.formulario.autor?.trim();

    if (!titulo || !autor) {
      this.formError.set('Título y autor son obligatorios.');
      return;
    }

    const datos: LibroInput = {
      titulo,
      autor,
      tipo: this.formulario.tipo || 'Novela',
      genero: this.formulario.genero?.trim() || undefined,
      anio: this.formulario.anio ? Number(this.formulario.anio) : undefined,
      editorial: this.formulario.editorial?.trim() || undefined,
      isbn: this.formulario.isbn?.trim() || undefined,
      precio: Number(this.formulario.precio) || 0,
      stock: Number(this.formulario.stock) || 0,
      portada: this.formulario.portada?.trim() || undefined,
      descripcion: this.formulario.descripcion?.trim() || undefined,
    };

    const libro = this.editando();
    this.guardando.set(true);
    this.formError.set(null);

    const peticion = libro
      ? this.libroService.actualizar(libro._id, datos)
      : this.libroService.crear(datos);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.formularioAbierto.set(false);
        this.aviso.set(libro ? 'Libro actualizado.' : 'Libro creado.');
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.formError.set(err?.error?.message ?? 'No se pudo guardar el libro.');
      },
    });
  }

  protected eliminar(libro: Libro): void {
    if (!confirm(`¿Eliminar "${libro.titulo}" del catálogo? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.libroService.eliminar(libro._id).subscribe({
      next: () => {
        this.aviso.set('Libro eliminado.');
        this.cargar();
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se pudo eliminar el libro.');
      },
    });
  }

  private vacio(): LibroInput {
    return {
      titulo: '',
      autor: '',
      tipo: 'Novela',
      genero: '',
      editorial: '',
      isbn: '',
      precio: 0,
      stock: 0,
      portada: '',
      descripcion: '',
    };
  }
}
