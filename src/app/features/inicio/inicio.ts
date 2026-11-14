import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type IconoRed = 'github' | 'instagram' | 'x' | 'tiktok';

interface RedSocial {
  nombre: string;
  url: string;
  icono: IconoRed;
}

@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  protected readonly redes: RedSocial[] = [
    { nombre: 'GitHub', url: 'https://github.com/elchangox720-lab', icono: 'github' },
    { nombre: 'Instagram', url: '', icono: 'instagram' },
    { nombre: 'X', url: '', icono: 'x' },
    { nombre: 'TikTok', url: '', icono: 'tiktok' },
  ];

  protected panelRedes = false;

  protected alternarRedes(): void {
    this.panelRedes = !this.panelRedes;
  }
}
