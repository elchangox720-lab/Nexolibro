import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Resena, ResenasLibro } from '../models/resena';

export interface ResenaInput {
  calificacion: number;
  comentario?: string;
}

@Injectable({ providedIn: 'root' })
export class ResenaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/resenas`;

  listar(libroId: string): Observable<ResenasLibro> {
    return this.http.get<ResenasLibro>(`${this.base}/libro/${libroId}`);
  }

  guardar(libroId: string, resena: ResenaInput): Observable<Resena> {
    return this.http.put<Resena>(`${this.base}/${libroId}`, resena);
  }

  eliminar(libroId: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(`${this.base}/${libroId}`);
  }
}
