export interface Resena {
  _id: string;
  libro: string;
  usuario: {
    _id: string;
    nombre: string;
  };
  calificacion: number;
  comentario?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResenasLibro {
  resenas: Resena[];
  promedio: number;
  total: number;
}
