import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type IconoRed = 'github' | 'whatsapp' | 'x' | 'tiktok';

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
    { nombre: 'WhatsApp', url: 'https://wa.me/573222326038', icono: 'whatsapp' },
    { nombre: 'X', url: 'https://x.com/elchango725', icono: 'x' },
    { nombre: 'TikTok', url: 'https://www.tiktok.com/@elchango725', icono: 'tiktok' },
    { nombre: 'GitHub', url: 'https://github.com/elchangox720-lab', icono: 'github' },
  ];

  protected panelRedes = false;

  protected alternarRedes(): void {
    this.panelRedes = !this.panelRedes;
  }
}
