import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FirestoreService, Item, Box } from '../firestore.service';
import { Observable, combineLatest, map, startWith, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface ItemWithBox {
  item: Item;
  box: Box;
}

@Component({
  selector: 'inv-item-search',
  standalone: true,
  templateUrl: './item-search.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
})
export class ItemSearchComponent {
  private fb: FormBuilder = inject(FormBuilder);
  private firestoreService: FirestoreService = inject(FirestoreService);

  searchForm: FormGroup;
  searchResults$: Observable<ItemWithBox[]>;
  isLoading = false;

  constructor() {
    this.searchForm = this.fb.group({
      query: ['']
    });

    // Create search observable that reacts to form changes
    this.searchResults$ = this.searchForm.get('query')!.valueChanges.pipe(
      startWith(''),
      switchMap(query => {
        if (!query || query.trim().length < 2) {
          return new Observable<Array<ItemWithBox>>(observer => observer.next([]));
        }

        this.isLoading = true;
        return this.searchItems(query.trim().toLowerCase());
      })
    );
  }

  private searchItems(query: string): Observable<ItemWithBox[]> {
    return this.firestoreService.getBoxes().pipe(
      switchMap(boxes => {
        if (boxes.length === 0) {
          this.isLoading = false;
          return new Observable<Array<ItemWithBox>>(observer => observer.next([]));
        }

        // Get items from all boxes
        const itemObservables = boxes.map(box =>
          this.firestoreService.getItems(box.id!).pipe(
            map(items => items.map(item => ({ item, box })))
          )
        );

        return combineLatest(itemObservables).pipe(
          map(allItemsWithBoxes => {
            this.isLoading = false;
            // Flatten the array and filter by search query
            const flatItems = allItemsWithBoxes.flat();
            return flatItems.filter(({ item }) =>
              item.name.toLowerCase().includes(query) ||
              (item.description && item.description.toLowerCase().includes(query))
            );
          })
        );
      })
    );
  }

  clearSearch(): void {
    this.searchForm.get('query')?.setValue('');
  }

  highlightMatch(text: string, query: string): string {
    if (!query || !text) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 rounded">$1</mark>');
  }
}