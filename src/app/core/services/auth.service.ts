import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CredencialesLogin,
  CredencialesRegistro,
  RespuestaAuth,
  Usuario,
} from '../models/usuario';

interface Sesion {
  token: string;
  usuario: Usuario;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/auth`;
  private readonly storageKey = 'nexolibro.sesion';
  private readonly sesion = signal<Sesion | null>(this.leerSesion());

  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly autenticado = computed(() => this.sesion() !== null);

  registrar(datos: CredencialesRegistro): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.api}/registro`, datos)
      .pipe(tap((respuesta) => this.guardar(respuesta)));
  }

  login(datos: CredencialesLogin): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.api}/login`, datos)
      .pipe(tap((respuesta) => this.guardar(respuesta)));
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.sesion.set(null);
  }

  token(): string | null {
    return this.sesion()?.token ?? null;
  }

  private guardar(respuesta: RespuestaAuth): void {
    const sesion: Sesion = { token: respuesta.token, usuario: respuesta.usuario };
    localStorage.setItem(this.storageKey, JSON.stringify(sesion));
    this.sesion.set(sesion);
  }

  private leerSesion(): Sesion | null {
    try {
      const guardado = localStorage.getItem(this.storageKey);
      return guardado ? (JSON.parse(guardado) as Sesion) : null;
    } catch {
      return null;
    }
  }
}
