import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PoButtonModule } from '@po-ui/ng-components';

/**
 * Página provisória que confirma que Angular, SSR, PO UI e o tema estão funcionando.
 * Será substituída pela tela de login (spec 001).
 */
@Component({
  selector: 'app-home-page',
  imports: [PoButtonModule],
  template: `
    <main class="home">
      <h1 class="home__title">Party Radar</h1>
      <p class="home__subtitle">Projeto configurado. A próxima etapa é a tela de login.</p>
      <po-button p-label="Tudo certo" p-kind="primary" [p-disabled]="true" />
    </main>
  `,
  styles: `
    .home {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 24px;
      text-align: center;
    }
    .home__title {
      margin: 0;
      font-family: var(--font-family-heading);
      font-size: 40px;
    }
    .home__subtitle {
      margin: 0;
      color: var(--color-neutral-mid-60);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}
