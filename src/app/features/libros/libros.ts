import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
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

  protected readonly libros = signal<Libro[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

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
}
