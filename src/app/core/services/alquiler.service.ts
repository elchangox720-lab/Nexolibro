import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Alquiler,
  ConfiguracionPagos,
  RespuestaAlquiler,
  RespuestaEstadoPago,
} from '../models/alquiler';

@Injectable({ providedIn: 'root' })
export class AlquilerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/alquileres`;
  private readonly pagosUrl = `${environment.apiUrl}/pagos`;

  listar(): Observable<Alquiler[]> {
    return this.http.get<Alquiler[]>(this.baseUrl);
  }

  alquilar(libroId: string, cedula: string, dias = 14): Observable<RespuestaAlquiler> {
    return this.http.post<RespuestaAlquiler>(this.baseUrl, { libroId, cedula, dias });
  }

  renovar(id: string, dias = 14): Observable<RespuestaAlquiler> {
    return this.http.post<RespuestaAlquiler>(`${this.baseUrl}/${id}/renovar`, { dias });
  }

  pagarMulta(id: string): Observable<RespuestaAlquiler> {
    return this.http.post<RespuestaAlquiler>(`${this.baseUrl}/${id}/pagar-multa`, {});
  }

  devolver(id: string): Observable<Alquiler> {
    return this.http.post<Alquiler>(`${this.baseUrl}/${id}/devolver`, {});
  }

  obtenerLectura(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/lectura`, { responseType: 'blob' });
  }

  listarAdmin(): Observable<Alquiler[]> {
    return this.http.get<Alquiler[]>(`${this.baseUrl}/admin`);
  }

  devolverAdmin(id: string): Observable<Alquiler> {
    return this.http.post<Alquiler>(`${this.baseUrl}/admin/${id}/devolver`, {});
  }

  estadoPago(referencia: string, wompiId?: string | null): Observable<RespuestaEstadoPago> {
    let params = new HttpParams();

    if (wompiId) {
      params = params.set('id', wompiId);
    }

    return this.http.get<RespuestaEstadoPago>(
      `${this.pagosUrl}/${encodeURIComponent(referencia)}`,
      { params },
    );
  }

  configuracionPagos(): Observable<ConfiguracionPagos> {
    return this.http.get<ConfiguracionPagos>(`${this.pagosUrl}/config`);
  }
}
