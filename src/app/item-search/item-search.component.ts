import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIconComponent } from '@ng-icons/core';
import { matClose, matDescription, matEdit, matMoveUp, matRemoveRedEye, matSearch, matSync } from '@ng-icons/material-icons/baseline';
import { combineLatest, map, Observable, of, startWith, switchMap } from 'rxjs';
import { MoveItemDialogComponent } from '../move-item-dialog/move-item-dialog.component';
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
    MoveItemDialogComponent,
    NgIconComponent,
  ],
})
export class ItemSearchComponent {
  readonly #fb: FormBuilder = inject(FormBuilder);
  readonly #firestoreService: FirestoreService = inject(FirestoreService);

  protected readonly ICONS = {
    close: matClose,
    description: matDescription,
    edit: matEdit,
    move: matMoveUp,
    search: matSearch,
    sync: matSync,
    view: matRemoveRedEye
  };

  protected searchForm: FormGroup;
  protected searchResults$: Observable<Array<ItemWithBox>>;
  protected isLoading = false;
  protected selectedItemData: ItemWithBox | null = null;
  protected availableBoxes$: Observable<Array<Box>> = this.#firestoreService.getBoxes();
  protected isMoving = false;

  @ViewChild(MoveItemDialogComponent) public moveItemDialog!: MoveItemDialogComponent;

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

  protected openMoveItemDialog(itemData: ItemWithBox): void {
    this.selectedItemData = itemData;
    this.availableBoxes$ = this.#firestoreService.getBoxes().pipe(
      map(boxes => boxes.filter(box => box.id !== itemData.box.id))
    );
    this.moveItemDialog.open();
  }

  protected onMoveItemDialogClosed(): void {
    this.selectedItemData = null;
    this.isMoving = false;
  }

  protected onMoveItemToBox(targetBoxId: string): void {
    if (this.selectedItemData?.item.id && !this.isMoving) {
      this.isMoving = true;
      this.#firestoreService.moveItem(
        this.selectedItemData.box.id!,
        targetBoxId,
        this.selectedItemData.item.id
      ).subscribe({
        next: () => {
          console.debug('Item moved successfully!');
          this.moveItemDialog.close();
          this.isMoving = false;
          // Trigger a search refresh
          const currentQuery = this.searchForm.get('query')?.value as string;
          if (currentQuery) {
            this.searchForm.get('query')?.setValue(currentQuery);
          }
        },
        error: (error: unknown) => {
          console.error('Error moving item:', error);
          this.isMoving = false;
        }
      });
    }
  }
}