import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { formatHours } from '../../domain/player-card';
import { GameBlock, GameKind, blockRows } from '../../domain/player-radar';

/**
 * Blocos de jogos (spec 004, CA4 e CA10): cada bloco tem o tamanho das horas do jogo, e os do tipo
 * escolhido ficam acesos.
 */
@Component({
  selector: 'app-game-blocks',
  templateUrl: './game-blocks.component.html',
  styleUrl: './game-blocks.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameBlocksComponent {
  readonly blocks = input.required<readonly GameBlock[]>();
  /** Tipo aceso; com `null`, nenhum. */
  readonly selected = input<GameKind | null>(null);

  protected readonly rows = computed(() =>
    blockRows(this.blocks()).map((row) =>
      row.map((block) => ({
        ...block,
        label: formatHours(block.hours),
        lit: block.kind !== null && block.kind === this.selected(),
      })),
    ),
  );
}
