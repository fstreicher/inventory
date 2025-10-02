import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent } from '@ng-icons/core';
import { matArrowForwardIos, matChevronRight, matPlus } from '@ng-icons/material-icons/baseline';
import { Observable, map, startWith } from 'rxjs';
import { Box, FirestoreService } from '../services/firestore.service';
import { OfflineService } from '../services/offline.service';

type BoxListState = {
  loading: boolean;
  boxes: Array<Box>;
}

@Component({
  selector: 'inv-box-list',
  templateUrl: './box-list.component.html',
  imports: [
    CommonModule,
    RouterLink,
    NgIconComponent,
  ],
})
export class BoxListComponent {
  readonly #firestoreService: FirestoreService = inject(FirestoreService);
  protected offlineService = inject(OfflineService);

  protected readonly ICONS = {
    chevronRight: matArrowForwardIos,
    plus: matPlus,
  };

  protected boxState$: Observable<BoxListState> = this.#firestoreService.getBoxes().pipe(
    map(boxes => ({ loading: false, boxes })),
    startWith({ loading: true, boxes: [] })
  );
}
