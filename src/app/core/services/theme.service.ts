import { Injectable, signal } from '@angular/core';

export type Tema = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'nexolibro.tema';
  private readonly _tema = signal<Tema>(this.leerTemaInicial());

  readonly tema = this._tema.asReadonly();

  constructor() {
    this.aplicar(this._tema());
  }

  alternar(): void {
    this.aplicar(this._tema() === 'dark' ? 'light' : 'dark');
  }

  private leerTemaInicial(): Tema {
    const guardado = localStorage.getItem(this.storageKey);
    return guardado === 'light' ? 'light' : 'dark';
  }

  private aplicar(tema: Tema): void {
    this._tema.set(tema);
    document.documentElement.dataset['theme'] = tema;
    localStorage.setItem(this.storageKey, tema);
  }
}
