import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly reinicio = new Subject<void>();

  readonly reinicios$ = this.reinicio.asObservable();

  solicitarReinicio(): void {
    this.reinicio.next();
  }
}
