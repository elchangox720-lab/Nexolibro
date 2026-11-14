export interface Usuario {
  _id: string;
  nombre: string;
  email: string;
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
