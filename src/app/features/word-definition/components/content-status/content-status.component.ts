import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BookType, CircleAlert, LucideAngularModule } from 'lucide-angular';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-content-status',
  imports: [SpinnerComponent, LucideAngularModule],
  templateUrl: './content-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentStatusComponent {
  protected readonly ICONS = {
    BookType,
    CircleAlert,
  };

  public readonly isLoading = input(false);

  public readonly error = input<string | null>(null);

  public readonly isEmpty = input(true);
}
