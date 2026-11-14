export type RolUsuario = 'usuario' | 'admin';

export interface Usuario {
  _id: string;
  nombre: string;
  email: string;
  rol?: RolUsuario;
  createdAt?: string;
  updatedAt?: string;
}

export interface CredencialesRegistro {
  nombre: string;
  email: string;
  password: string;
}

export interface CredencialesLogin {
  email: string;
  password: string;
}

export interface RespuestaAuth {
  token: string;
  usuario: Usuario;
}
