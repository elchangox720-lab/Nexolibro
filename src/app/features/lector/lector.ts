import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { firstValueFrom } from 'rxjs';
import { Alquiler } from '../../core/models/alquiler';
import { AlquilerService } from '../../core/services/alquiler.service';

@Component({
  selector: 'app-lector',
  imports: [RouterLink],
  templateUrl: './lector.html',
  styleUrl: './lector.scss',
})
export class Lector {
  private readonly route = inject(ActivatedRoute);
  private readonly alquilerService = inject(AlquilerService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly visor = viewChild<ElementRef<HTMLDivElement>>('visor');
  private readonly lienzo = viewChild<ElementRef<HTMLCanvasElement>>('lienzo');

  protected readonly alquiler = signal<Alquiler | null>(null);
  protected readonly cargando = signal(true);
  protected readonly renderizando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly pagina = signal(1);
  protected readonly totalPaginas = signal(0);
  protected readonly zoom = signal(1);

  protected readonly puedeRetroceder = computed(() => this.pagina() > 1 && !this.renderizando());
  protected readonly puedeAvanzar = computed(
    () => this.pagina() < this.totalPaginas() && !this.renderizando(),
  );
  protected readonly porcentajeZoom = computed(() => `${Math.round(this.zoom() * 100)}%`);

  private documento: PDFDocumentProxy | null = null;
  private tareaCarga: PDFDocumentLoadingTask | null = null;
  private tareaRender: RenderTask | null = null;
  private renderEnCurso = false;
  private renderPendiente = false;
  private destruido = false;
  private temporizadorResize: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.cargar();

    this.destroyRef.onDestroy(() => {
      this.destruido = true;

      if (this.temporizadorResize) {
        clearTimeout(this.temporizadorResize);
      }

      this.tareaRender?.cancel();
      void this.tareaCarga?.destroy();
    });
  }

  protected anterior(): void {
    if (!this.puedeRetroceder()) {
      return;
    }

    this.pagina.update((valor) => valor - 1);
    void this.renderizarPagina();
  }

  protected siguiente(): void {
    if (!this.puedeAvanzar()) {
      return;
    }

    this.pagina.update((valor) => valor + 1);
    void this.renderizarPagina();
  }

  protected irAPagina(valor: string): void {
    const numero = Number.parseInt(valor, 10);

    if (!Number.isFinite(numero)) {
      return;
    }

    this.pagina.set(Math.min(Math.max(1, numero), this.totalPaginas()));
    void this.renderizarPagina();
  }

  protected cambiarZoom(delta: number): void {
    const siguiente = Math.min(3, Math.max(0.5, this.zoom() + delta));
    this.zoom.set(Math.round(siguiente * 100) / 100);
    void this.renderizarPagina();
  }

  protected ajustar(): void {
    this.zoom.set(1);
    void this.renderizarPagina();
  }

  @HostListener('window:resize')
  protected alRedimensionar(): void {
    if (this.cargando() || this.error()) {
      return;
    }

    if (this.temporizadorResize) {
      clearTimeout(this.temporizadorResize);
    }

    this.temporizadorResize = setTimeout(() => {
      void this.renderizarPagina();
    }, 180);
  }

  @HostListener('document:keydown', ['$event'])
  protected alPresionarTecla(evento: KeyboardEvent): void {
    if (
      evento.target instanceof HTMLInputElement ||
      evento.target instanceof HTMLTextAreaElement ||
      evento.target instanceof HTMLSelectElement
    ) {
      return;
    }

    if (evento.key === 'ArrowLeft') {
      evento.preventDefault();
      this.anterior();
    } else if (evento.key === 'ArrowRight') {
      evento.preventDefault();
      this.siguiente();
    }
  }

  private cargar(): void {
    const alquilerId = this.route.snapshot.paramMap.get('id');

    if (!alquilerId) {
      this.error.set('No se indicó un alquiler para abrir.');
      this.cargando.set(false);
      return;
    }

    this.alquilerService.listar().subscribe({
      next: (alquileres) => {
        const alquiler = alquileres.find((item) => item._id === alquilerId);

        if (!alquiler) {
          this.error.set('No encontramos este alquiler entre tus préstamos.');
          this.cargando.set(false);
          return;
        }

        this.alquiler.set(alquiler);

        if (alquiler.estado !== 'activo') {
          this.error.set(
            'Este alquiler ya fue devuelto. El archivo de lectura no está disponible.',
          );
          this.cargando.set(false);
          return;
        }

        if (alquiler.vencido) {
          this.error.set('Tu alquiler venció. El archivo de lectura ya no está disponible.');
          this.cargando.set(false);
          return;
        }

        if (!alquiler.lecturaDisponible) {
          this.error.set('Archivo de lectura no disponible para este libro.');
          this.cargando.set(false);
          return;
        }

        void this.abrirPdf(alquilerId);
      },
      error: async (err) => {
        this.error.set(await this.mensajeError(err, 'No pudimos verificar tu alquiler.'));
        this.cargando.set(false);
      },
    });
  }

  private async abrirPdf(alquilerId: string): Promise<void> {
    try {
      const blob = await firstValueFrom(this.alquilerService.obtenerLectura(alquilerId));

      if (!blob || blob.size === 0) {
        throw new Error('El archivo de lectura está vacío.');
      }

      const datos = new Uint8Array(await blob.arrayBuffer());
      const pdfjs = await import('pdfjs-dist');

      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'assets/pdfjs/pdf.worker.min.mjs',
        document.baseURI,
      ).toString();

      const tarea = pdfjs.getDocument({
        data: datos,
        useSystemFonts: true,
      });

      this.tareaCarga = tarea;
      const documento = await tarea.promise;

      if (this.destruido) {
        void tarea.destroy();
        return;
      }

      this.documento = documento;
      this.totalPaginas.set(documento.numPages);
      this.cargando.set(false);
      this.programarRender();
    } catch (err) {
      if (this.destruido) {
        return;
      }

      this.error.set(await this.mensajeError(err, 'No se pudo abrir el archivo de lectura.'));
      this.cargando.set(false);
    }
  }

  private programarRender(intentos = 0): void {
    if (this.destruido) {
      return;
    }

    if (this.lienzo()?.nativeElement) {
      void this.renderizarPagina();
      return;
    }

    if (intentos < 20) {
      setTimeout(() => this.programarRender(intentos + 1), 50);
    }
  }

  private async renderizarPagina(): Promise<void> {
    if (this.renderEnCurso) {
      this.renderPendiente = true;
      return;
    }

    const documento = this.documento;
    const lienzo = this.lienzo()?.nativeElement;
    const visor = this.visor()?.nativeElement;

    if (!documento || !lienzo || !visor) {
      return;
    }

    this.renderEnCurso = true;
    this.renderizando.set(true);

    const numero = this.pagina();

    try {
      const pagina = await documento.getPage(numero);

      if (this.destruido || numero !== this.pagina()) {
        return;
      }

      const base = pagina.getViewport({ scale: 1 });
      const anchoDisponible = Math.max(240, visor.clientWidth - 32);
      const escala = (anchoDisponible / base.width) * this.zoom();
      const viewport = pagina.getViewport({ scale: escala });
      const densidad = Math.min(window.devicePixelRatio || 1, 2);

      lienzo.width = Math.floor(viewport.width * densidad);
      lienzo.height = Math.floor(viewport.height * densidad);
      lienzo.style.width = `${Math.floor(viewport.width)}px`;
      lienzo.style.height = `${Math.floor(viewport.height)}px`;

      const tarea = pagina.render({
        canvas: lienzo,
        viewport,
        transform: densidad === 1 ? undefined : [densidad, 0, 0, densidad, 0, 0],
      });

      this.tareaRender = tarea;
      await tarea.promise;
    } catch (err) {
      const nombre = (err as { name?: string } | null)?.name;

      if (!this.destruido && nombre !== 'RenderingCancelledException') {
        this.error.set('No se pudo mostrar esta página del archivo.');
      }
    } finally {
      this.renderEnCurso = false;

      if (!this.destruido) {
        this.renderizando.set(false);

        if (this.renderPendiente) {
          this.renderPendiente = false;
          void this.renderizarPagina();
        }
      }
    }
  }

  private async mensajeError(error: unknown, respaldo: string): Promise<string> {
    const httpError = error as HttpErrorResponse;
    const cuerpo = httpError?.error;

    if (cuerpo instanceof Blob) {
      try {
        const texto = await cuerpo.text();
        const datos = JSON.parse(texto) as { message?: string };

        if (datos.message) {
          return datos.message;
        }
      } catch {
        return respaldo;
      }
    }

    if (cuerpo && typeof cuerpo === 'object' && 'message' in cuerpo) {
      const mensaje = (cuerpo as { message?: unknown }).message;

      if (typeof mensaje === 'string' && mensaje) {
        return mensaje;
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return respaldo;
  }
}
