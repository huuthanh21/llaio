import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  public readonly variant = input<BadgeVariant>('default');

  public readonly className = input('');

  protected readonly classes = computed(() => {
    return ['badge', `variant-${this.variant()}`, this.className()].join(' ');
  });
}
