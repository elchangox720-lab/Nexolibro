import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Alquiler, Pago } from '../../core/models/alquiler';
import { AlquilerService } from '../../core/services/alquiler.service';

type EstadoVista = 'cargando' | 'pendiente' | 'aprobado' | 'fallido' | 'error';

@Component({
  selector: 'app-pago-resultado',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './pago-resultado.html',
  styleUrl: './pago-resultado.scss',
})
export class PagoResultado implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly alquilerService = inject(AlquilerService);
  private temporizador: ReturnType<typeof setTimeout> | null = null;
  private intentos = 0;

  protected referencia = '';
  protected readonly estado = signal<EstadoVista>('cargando');
  protected readonly pago = signal<Pago | null>(null);
  protected readonly alquiler = signal<Alquiler | null>(null);
  protected readonly mensaje = signal('Estamos verificando tu pago...');
  protected readonly requiereLogin = signal(false);

  ngOnInit(): void {
    this.referencia = this.route.snapshot.paramMap.get('referencia') ?? '';

    if (!this.referencia) {
      this.estado.set('error');
      this.mensaje.set('No encontramos la referencia del pago.');
      return;
    }

    this.consultar();
  }

  ngOnDestroy(): void {
    if (this.temporizador) {
      clearTimeout(this.temporizador);
    }
  }

  protected reintentar(): void {
    this.intentos = 0;
    this.requiereLogin.set(false);
    this.estado.set('cargando');
    this.mensaje.set('Estamos verificando tu pago...');
    this.consultar();
  }

  protected etiquetaEstado(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'aprobado':
        return 'Aprobado';
      case 'rechazado':
        return 'Rechazado';
      case 'expirado':
        return 'Expirado';
      case 'reembolsado':
        return 'Reembolsado';
      default:
        return estado;
    }
  }

  private consultar(): void {
    const wompiId = this.route.snapshot.queryParamMap.get('id');

    this.alquilerService.estadoPago(this.referencia, wompiId).subscribe({
      next: (respuesta) => {
        this.pago.set(respuesta.pago);
        this.alquiler.set(respuesta.alquiler);

        if (respuesta.pago.estado === 'aprobado') {
          this.estado.set('aprobado');

          if (respuesta.alquiler?.estado === 'pendiente_pago') {
            this.mensaje.set('El pago fue aprobado. Estamos activando tu alquiler.');
          } else if (respuesta.pago.tipo === 'renovacion') {
            this.mensaje.set('La renovación fue aprobada.');
          } else if (respuesta.pago.tipo === 'multa') {
            this.mensaje.set('La multa fue pagada.');
          } else {
            this.mensaje.set('El pago fue aprobado y tu alquiler está activo.');
          }

          return;
        }

        if (['rechazado', 'expirado', 'reembolsado'].includes(respuesta.pago.estado)) {
          this.estado.set('fallido');
          this.mensaje.set(
            respuesta.pago.nota ||
              'El pago no se completó. Puedes intentarlo de nuevo desde el catálogo.',
          );
          return;
        }

        this.estado.set('pendiente');
        this.mensaje.set(
          'Wompi todavía está confirmando el pago. Esto puede tardar unos segundos.',
        );

        if (this.intentos < 10) {
          this.intentos += 1;
          this.temporizador = setTimeout(() => this.consultar(), 3000);
        } else {
          this.mensaje.set(
            'El pago sigue pendiente. Revisa tus alquileres o vuelve a intentarlo en unos minutos.',
          );
        }
      },
      error: (err) => {
        this.estado.set('error');

        if (err?.status === 401) {
          this.requiereLogin.set(true);
          this.mensaje.set('Inicia sesión para consultar el estado de este pago.');
          return;
        }

        this.mensaje.set(
          err?.error?.message ?? 'No pudimos consultar el estado del pago. Intenta de nuevo.',
        );
      },
    });
  }
}
