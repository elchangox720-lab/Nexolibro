export type EstadoLectura = 'quiero-leer' | 'leyendo' | 'leido';

export interface BibliotecaItem {
  _id: string;
  libro: string;
  favorito: boolean;
  estado?: EstadoLectura;
  createdAt: string;
  updatedAt: string;
}

export interface CambiosBiblioteca {
  favorito?: boolean;
  estado?: EstadoLectura | null;
}
