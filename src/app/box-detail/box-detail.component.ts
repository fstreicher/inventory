import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, Observable, startWith, switchMap } from 'rxjs';
import { Box, FirestoreService, Item } from '../firestore.service';

interface ItemListState {
  loading: boolean;
  items: Array<Item>;
}

@Component({
  selector: 'inv-box-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './box-detail.component.html',
})
export class BoxDetailComponent {
  #firestoreService: FirestoreService = inject(FirestoreService);
  #route: ActivatedRoute = inject(ActivatedRoute);
  #router: Router = inject(Router);

  box$: Observable<Box | undefined> = this.#route.paramMap.pipe(
    switchMap(params => this.#firestoreService.getBox(params.get('id') as string))
  );

  itemState$: Observable<ItemListState> = this.#route.paramMap.pipe(
    switchMap(params =>
      this.#firestoreService.getItems(params.get('id') as string).pipe(
        map(items => ({ loading: false, items })),
        startWith({ loading: true, items: [] })
      )
    )
  );

  boxId: string = '';

  constructor() {
    this.#route.paramMap.subscribe(params => {
      this.boxId = params.get('id') as string;
    });
  }

  deleteBox(boxId: string | undefined): void {
    if (boxId && confirm('Are you sure you want to delete this box and all its contents?')) {
      this.#firestoreService.deleteBox(boxId).subscribe(() => {
        console.log('Box deleted successfully!');
        this.#router.navigate(['/boxes']);
      });
    }
  }

  deleteItem(itemId: string | undefined): void {
    if (itemId && confirm('Are you sure you want to delete this item?')) {
      this.#firestoreService.deleteItem(this.boxId, itemId).subscribe(() => {
        console.log('Item deleted successfully!');
      });
    }
  }
}
