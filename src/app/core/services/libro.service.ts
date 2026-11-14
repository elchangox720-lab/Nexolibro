import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Libro, LibroInput } from '../models/libro';

@Injectable({ providedIn: 'root' })
export class LibroService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/libros`;

  listar(): Observable<Libro[]> {
    return this.http.get<Libro[]>(this.baseUrl);
  }

  obtener(id: string): Observable<Libro> {
    return this.http.get<Libro>(`${this.baseUrl}/${id}`);
  }

  crear(libro: LibroInput): Observable<Libro> {
    return this.http.post<Libro>(this.baseUrl, libro);
  }

  actualizar(id: string, libro: Partial<LibroInput>): Observable<Libro> {
    return this.http.put<Libro>(`${this.baseUrl}/${id}`, libro);
  }

  eliminar(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(`${this.baseUrl}/${id}`);
  }
}
