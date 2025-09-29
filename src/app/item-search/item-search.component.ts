import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { Box, FirestoreService, Item } from '../services/firestore.service';

export type ItemWithBox = {
  item: Item;
  box: Box;
}

@Component({
  selector: 'inv-item-search',
  templateUrl: './item-search.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
})
export class ItemSearchComponent {
  readonly #fb: FormBuilder = inject(FormBuilder);
  readonly #firestoreService: FirestoreService = inject(FirestoreService);

  protected searchForm: FormGroup;
  protected searchResults$: Observable<Array<ItemWithBox>>;
  protected isLoading = false;

  constructor() {
    this.searchForm = this.#fb.group({
      query: ['']
    });

    // Create search observable that reacts to form changes
    this.searchResults$ = this.searchForm.get('query')!.valueChanges.pipe(
      switchMap((query: string) => {
        if (!query || query.trim().length < 2) {
          return of([]);
        }

        this.isLoading = true;
        return this.#searchItems(query.trim().toLowerCase());
      }),
      startWith([]),
    );
  }

  #searchItems(query: string): Observable<Array<ItemWithBox>> {
    return this.#firestoreService.getBoxes().pipe(
      switchMap((boxes: Array<Box>) => {
        if (boxes.length === 0) {
          this.isLoading = false;
          return of([]);
        }

        // Get items from all boxes
        const itemObservables: Array<Observable<Array<ItemWithBox>>> = boxes.map((box: Box) =>
          this.#firestoreService.getItems(box.id!).pipe(
            map((items: Array<Item>) => items.map((item: Item) => ({ item, box })))
          ));

        return combineLatest(itemObservables).pipe(
          map((allItemsWithBoxes: Array<Array<ItemWithBox>>) => {
            this.isLoading = false;
            // Flatten the array and filter by search query
            const flatItems = allItemsWithBoxes.flat();
            return flatItems.filter(({ item }: ItemWithBox) =>
              item.name.toLowerCase().includes(query) ||
              (item.description?.toLowerCase().includes(query)));
          })
        );
      })
    );
  }

  protected clearSearch(): void {
    this.searchForm.get('query')?.setValue('');
  }

  protected highlightMatch(text: string, query: string): string {
    if (!query || !text) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 rounded">$1</mark>');
  }
}