import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';
@Directive({
  selector: 'lib-card-header, [libCardHeader]',
  host: {
    class: 'flex flex-col space-y-1.5 p-6',
  },
})
export class CardHeaderDirective {}

@Directive({
  selector: 'lib-card-title, [libCardTitle]',
  host: {
    class: 'leading-none font-semibold tracking-tight',
  },
})
export class CardTitleDirective {}

@Directive({
  selector: 'lib-card-description, [libCardDescription]',
  host: {
    class: 'text-sm text-muted-foreground',
  },
})
export class CardDescriptionDirective {}

@Directive({
  selector: 'lib-card-content, [libCardContent]',
  host: {
    class: 'p-6 pt-0',
  },
})
export class CardContentDirective {}

@Directive({
  selector: 'lib-card-footer, [libCardFooter]',
  host: {
    class: 'flex items-center p-6 pt-0',
  },
})
export class CardFooterDirective {}

@Component({
  selector: 'lib-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card.component.html',
})
export class CardComponent {
  public readonly className = input('');
}
