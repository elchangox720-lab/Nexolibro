export interface Libro {
  _id: string;
  titulo: string;
  autor: string;
  tipo?: string;
  isbn?: string;
  editorial?: string;
  anio?: number;
  genero?: string;
  precio: number;
  stock: number;
  tarifaAlquiler?: number;
  tarifaDias?: number;
  pagoRequerido?: boolean;
  modoPagos?: 'auto' | 'wompi' | 'directo';
  descripcion?: string;
  portada?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LibroInput {
  titulo: string;
  autor: string;
  tipo?: string;
  isbn?: string;
  editorial?: string;
  anio?: number;
  genero?: string;
  precio?: number;
  stock?: number;
  descripcion?: string;
  portada?: string;
}
