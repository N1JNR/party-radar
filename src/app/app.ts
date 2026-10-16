import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthStore } from './core/auth/auth.store';

/**
 * Raiz do app. Enquanto verifica se já existe sessão, mostra só o indicador de
 * carregamento, para a tela de login não piscar (spec 001, CA11). O indicador é próprio, e não
 * do PO UI, para o PO UI continuar fora do bundle inicial.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly store = inject(AuthStore);

  constructor() {
    void this.store.restore();
  }
}
