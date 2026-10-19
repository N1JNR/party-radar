import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PoButtonModule } from '@po-ui/ng-components';

import { PartnershipQuestion, partnershipQuestionText } from '../../domain/partnership';

/** "Você jogou CS2 com Rafa ontem, das 22h às 23h40?" com Joguei e Não joguei (CA11). */
@Component({
  selector: 'app-partnership-question',
  imports: [PoButtonModule],
  templateUrl: './partnership-question.component.html',
  styleUrl: './partnership-question.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnershipQuestionComponent {
  readonly question = input.required<PartnershipQuestion>();
  readonly now = input.required<Date>();
  /** Salvando a resposta: os botões ficam desabilitados. */
  readonly answering = input(false);
  /** `true` = Joguei, `false` = Não joguei. */
  readonly answered = output<boolean>();

  protected readonly text = computed(() => partnershipQuestionText(this.question(), this.now()));
}
