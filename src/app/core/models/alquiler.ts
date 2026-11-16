import { Usuario } from './usuario';

export type EstadoAlquiler = 'activo' | 'devuelto';

export interface Alquiler {
  _id: string;
  usuario?: string | Pick<Usuario, '_id' | 'nombre' | 'email'> | null;
  libro: string;
  titulo: string;
  autor?: string;
  portada?: string;
  dias: number;
  fechaAlquiler: string;
  fechaVencimiento: string;
  fechaDevolucion?: string;
  estado: EstadoAlquiler;
  valorLibro: number;
  devueltoPor?: 'usuario' | 'admin';
  vencido: boolean;
  diasRestantes: number;
  createdAt: string;
  updatedAt: string;
}
