import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BibliotecaItem, CambiosBiblioteca } from '../models/biblioteca';

@Injectable({ providedIn: 'root' })
export class BibliotecaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/biblioteca`;

  listar(): Observable<BibliotecaItem[]> {
    return this.http.get<BibliotecaItem[]>(this.base);
  }

  actualizar(libroId: string, cambios: CambiosBiblioteca): Observable<BibliotecaItem> {
    return this.http.put<BibliotecaItem>(`${this.base}/${libroId}`, cambios);
  }

  eliminar(libroId: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(`${this.base}/${libroId}`);
  }
}
