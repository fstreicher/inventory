import { Component, inject } from '@angular/core';
import { FirestoreService, Box } from '../firestore.service';
import { OfflineService } from '../offline.service';
import { Observable, map, startWith } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface BoxListState {
  loading: boolean;
  boxes: Box[];
}

@Component({
  selector: 'inv-box-list',
  standalone: true,
  templateUrl: './box-list.component.html',
  imports: [CommonModule, RouterLink],
})
export class BoxListComponent {
  private firestoreService: FirestoreService = inject(FirestoreService);
  protected offlineService = inject(OfflineService);

  boxState$: Observable<BoxListState> = this.firestoreService.getBoxes().pipe(
    map(boxes => ({ loading: false, boxes })),
    startWith({ loading: true, boxes: [] })
  );
}
