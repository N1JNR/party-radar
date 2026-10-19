import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import {
  PoIconModule,
  PoMenuComponent,
  PoMenuModule,
  PoNotificationService,
} from '@po-ui/ng-components';

import { AuthStore } from '../../core/auth/auth.store';
import { HomeStore } from '../../features/home/data/home.store';
import { buildAppMenu } from './app-menu';

/**
 * Layout das telas autenticadas: `po-menu` fixo a partir de 1201 px e gaveta abaixo disso
 * (spec 002, CA1–CA3).
 *
 * A gaveta do `po-menu` abre por uma `div` sem foco de teclado e não fecha com Esc. Este layout
 * usa um botão próprio para abrir, fecha com Esc e devolve o foco ao botão (CA2, CA17). Ele usa
 * `mobileOpened` e `toggleMenuMobile()`, públicos no componente mas fora da documentação do PO UI;
 * os testes deste arquivo avisam se uma atualização mudar isso.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, PoMenuModule, PoIconModule],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeOnEscape()',
    // O `po-menu` fecha a gaveta sozinho quando a janela muda de tamanho.
    '(window:resize)': 'syncAfterMenuInteraction()',
  },
})
export class AppShellComponent {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly notification = inject(PoNotificationService);
  private readonly home = inject(HomeStore);
  private readonly menu = viewChild.required(PoMenuComponent);
  private readonly menuElement = viewChild.required(PoMenuComponent, { read: ElementRef });
  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');

  protected readonly menuOpen = signal(false);
  protected readonly menus = computed(() =>
    buildAppMenu(this.home.menuSquads(), {
      soon: (feature) => this.soon(feature),
      signOut: () => void this.signOut(),
    }),
  );

  protected openMenu(): void {
    if (!this.menu().mobileOpened) {
      this.menu().toggleMenuMobile();
    }
    this.menuOpen.set(true);
    // Leva o foco para o primeiro item quando a gaveta aparece.
    setTimeout(() => {
      const host = this.menuElement().nativeElement as HTMLElement;
      host.querySelector<HTMLElement>('.po-menu-item-link')?.focus();
    });
  }

  protected closeOnEscape(): void {
    if (!this.menuOpen()) {
      return;
    }
    if (this.menu().mobileOpened) {
      this.menu().toggleMenuMobile();
    }
    this.closed();
  }

  /** O `po-menu` fecha a gaveta sozinho ao escolher um destino ou tocar fora; aqui o foco volta. */
  protected syncAfterMenuInteraction(): void {
    if (this.menuOpen() && !this.menu().mobileOpened) {
      this.closed();
    }
  }

  private closed(): void {
    this.menuOpen.set(false);
    this.menuButton().nativeElement.focus();
  }

  private soon(feature: string): void {
    this.notification.information(`Em breve: ${feature}.`);
  }

  private async signOut(): Promise<void> {
    try {
      await this.auth.signOut();
    } catch {
      // A sessão local já terminou no AuthStore; seguimos para o login mesmo assim.
    }
    this.home.reset();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
