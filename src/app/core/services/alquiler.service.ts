import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Alquiler } from '../models/alquiler';

@Injectable({ providedIn: 'root' })
export class AlquilerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/alquileres`;

  listar(): Observable<Alquiler[]> {
    return this.http.get<Alquiler[]>(this.baseUrl);
  }

  alquilar(libroId: string, dias = 14): Observable<Alquiler> {
    return this.http.post<Alquiler>(this.baseUrl, { libroId, dias });
  }

  devolver(id: string): Observable<Alquiler> {
    return this.http.post<Alquiler>(`${this.baseUrl}/${id}/devolver`, {});
  }

  listarAdmin(): Observable<Alquiler[]> {
    return this.http.get<Alquiler[]>(`${this.baseUrl}/admin`);
  }

  devolverAdmin(id: string): Observable<Alquiler> {
    return this.http.post<Alquiler>(`${this.baseUrl}/admin/${id}/devolver`, {});
  }
}
