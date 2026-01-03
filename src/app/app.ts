import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GenankiService } from './core/services/genanki.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private genankiService = inject(GenankiService);

  public ngOnInit(): void {
    // Check if loaded
    console.log('Genanki available:', !!this.genankiService.genanki);
    console.log('SQL available:', !!this.genankiService.sql);
    // Try creating a deck (uncomment to test download)

    //   if (!this.genankiService.genanki || !this.genankiService.sql) {
    //     return;
    //   }

    //   const deck = this.genankiService.createDeck(1, 'Test Deck');
    //   const model = this.genankiService.createModel({
    //     id: '1',
    //     name: 'Test Model',
    //     flds: [{ name: 'Front' }, { name: 'Back' }],
    //     req: [[0, 'all', [0]]],
    //     tmpls: [{ name: 'Card 1', qfmt: '{{Front}}', afmt: '{{Back}}' }],
    //   });

    //   if (!deck || !model) {
    //     return;
    //   }

    //   deck.addNote(model.note(['Front', 'Back']));
    //   this.genankiService.createPackage(deck);
  }
}
