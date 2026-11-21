import { Usuario } from './usuario';

export type EstadoAlquiler = 'pendiente_pago' | 'activo' | 'devuelto' | 'cancelado';
export type EstadoPagoAlquiler =
  'no_requerido' | 'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado';
export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado' | 'expirado' | 'reembolsado';
export type TipoPago = 'alquiler' | 'renovacion' | 'multa';
export type ModoPagos = 'auto' | 'wompi' | 'directo';

export interface Pago {
  _id: string;
  usuario: string;
  libro?: string;
  alquiler?: string;
  tipo: TipoPago;
  referencia: string;
  monto: number;
  moneda: string;
  estado: EstadoPago;
  wompiId?: string;
  metodoPago?: string;
  email?: string;
  nombre?: string;
  cedula?: string;
  dias?: number;
  expiracion?: string;
  checkoutUrl?: string | null;
  aprobadoEn?: string;
  rechazadoEn?: string;
  nota?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alquiler {
  _id: string;
  usuario?: string | Pick<Usuario, '_id' | 'nombre' | 'email'> | null;
  libro: string;
  titulo: string;
  autor?: string;
  portada?: string;
  cedula?: string;
  dias: number;
  fechaAlquiler: string;
  fechaVencimiento: string;
  fechaDevolucion?: string;
  estado: EstadoAlquiler;
  valorLibro: number;
  devueltoPor?: 'usuario' | 'admin';
  pagoEstado: EstadoPagoAlquiler;
  pago?: string | Pago | null;
  referenciaPago?: string;
  checkoutUrl?: string | null;
  pagoExpiraEn?: string;
  tarifa: number;
  montoPagado: number;
  fechaPago?: string;
  renovaciones: number;
  multa: number;
  multaPagada: number;
  multaPendiente: number;
  diasAtraso: number;
  diasGracia: number;
  puedeRenovar: boolean;
  puedePagarMulta: boolean;
  vencido: boolean;
  diasRestantes: number;
  lecturaDisponible: boolean;
  lecturaPaginas: number | null;
  lecturaLicencia: string | null;
  lecturaFuente: string | null;
  lecturaFuenteUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RespuestaAlquiler {
  alquiler: Alquiler;
  pago: Pago | null;
  checkoutUrl: string | null;
  modo: ModoPagos;
  reutilizado?: boolean;
}

export interface RespuestaEstadoPago {
  pago: Pago;
  alquiler: Alquiler | null;
  checkoutUrl: string | null;
  modo: ModoPagos;
}

export interface ConfiguracionPagos {
  modo: ModoPagos;
  diasBase: number;
  tarifaPorcentaje: number;
  tarifaMinima: number;
  diasGracia: number;
  multaDiariaPorcentaje: number;
  multaMaximaPorcentaje: number;
  maxRenovaciones: number;
}
