import { Component, inject } from '@angular/core';
import { FirestoreService, Box } from '../firestore.service';
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
  imports: [CommonModule, RouterLink],
  templateUrl: './box-list.component.html',
  styleUrl: './box-list.component.css'
})
export class BoxListComponent {
  private firestoreService: FirestoreService = inject(FirestoreService);
  
  boxState$: Observable<BoxListState> = this.firestoreService.getBoxes().pipe(
    map(boxes => ({ loading: false, boxes })),
    startWith({ loading: true, boxes: [] })
  );
}
