import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HistorialItem } from '../models/historial';
import { Libro } from '../models/libro';

@Injectable({ providedIn: 'root' })
export class HistorialService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/historial`;

  listar(): Observable<HistorialItem[]> {
    return this.http.get<HistorialItem[]>(this.base);
  }

  registrar(libro: Libro): Observable<HistorialItem> {
    return this.http.post<HistorialItem>(this.base, {
      libroId: libro._id,
      titulo: libro.titulo,
      autor: libro.autor,
      portada: libro.portada,
    });
  }

  limpiar(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(this.base);
  }

  eliminar(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(`${this.base}/${id}`);
  }
}
