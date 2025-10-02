import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIconComponent } from '@ng-icons/core';
import {
  matArrowForwardIos,
  matDeleteForever,
  matEdit,
  matInbox,
  matMoveUp,
  matPlus,
  matQrCode
} from '@ng-icons/material-icons/baseline';
import { map, Observable, startWith, switchMap } from 'rxjs';
import { BreadcrumbComponent, type BreadcrumbItem } from '../breadcrumb/breadcrumb.component';
import { MoveItemDialogComponent } from '../move-item-dialog/move-item-dialog.component';
import { QrCodeComponent } from '../qr-code/qr-code.component';
import { Box, FirestoreService, Item } from '../services/firestore.service';

type ItemListState = {
  loading: boolean;
  items: Array<Item>;
}

@Component({
  selector: 'inv-box-detail',
  templateUrl: './box-detail.component.html',
  styleUrl: './box-detail.component.css',
  imports: [
    CommonModule,
    RouterLink,
    QrCodeComponent,
    MoveItemDialogComponent,
    NgIconComponent,
    BreadcrumbComponent,
  ],
})
export class BoxDetailComponent {
  readonly #firestoreService: FirestoreService = inject(FirestoreService);
  readonly #route: ActivatedRoute = inject(ActivatedRoute);
  readonly #router: Router = inject(Router);
  protected qrCodeUrl: string = '';

  protected readonly ICONS = {
    chevronRight: matArrowForwardIos,
    delete: matDeleteForever,
    document: matInbox,
    edit: matEdit,
    move: matMoveUp,
    plus: matPlus,
    qrCode: matQrCode,
  };

  @ViewChild('qrCodeDialog') public qrCodeDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild(MoveItemDialogComponent) public moveItemDialog!: MoveItemDialogComponent;

  public box$: Observable<Box | undefined> = this.#route.paramMap.pipe(
    switchMap(params => this.#firestoreService.getBox(params.get('id') as string))
  );

  public breadcrumbItems$: Observable<Array<BreadcrumbItem>> = this.box$.pipe(
    map(box => [
      {
        label: box?.name || 'Box',
        isCurrentPage: true
      }
    ])
  );

  public itemState$: Observable<ItemListState> = this.#route.paramMap.pipe(
    switchMap(params =>
      this.#firestoreService.getItems(params.get('id') as string).pipe(
        map(items => ({ loading: false, items })),
        startWith({ loading: true, items: [] })
      ))
  );

  public availableBoxes$: Observable<Array<Box>> = this.#firestoreService.getBoxes().pipe(
    map(boxes => boxes.filter(box => box.id !== this.boxId))
  );

  public boxId: string = '';
  public selectedItemId: string = '';
  public selectedItemName: string = '';
  public isMoving: boolean = false;

  constructor() {
    this.#route.paramMap.subscribe(params => {
      this.boxId = params.get('id') as string;
      this.qrCodeUrl = window.location.href;
    });
  }

  public openDialog(): void {
    this.qrCodeDialog.nativeElement.showModal();
  }

  public closeDialog(): void {
    this.qrCodeDialog.nativeElement.close();
  }

  public deleteBox(boxId: string | undefined): void {
    if (boxId && confirm('Are you sure you want to delete this box and all its contents?')) {
      this.#firestoreService.deleteBox(boxId).subscribe(() => {
        console.debug('Box deleted successfully!');
        this.#router.navigate(['/boxes']);
      });
    }
  }

  public deleteItem(itemId: string | undefined): void {
    if (itemId && confirm('Are you sure you want to delete this item?')) {
      this.#firestoreService.deleteItem(this.boxId, itemId).subscribe(() => {
        console.debug('Item deleted successfully!');
      });
    }
  }

  public openMoveItemDialog(itemId: string): void {
    // Find the item to get its name
    this.itemState$.subscribe(state => {
      const item = state.items.find(i => i.id === itemId);
      if (item) {
        this.selectedItemId = itemId;
        this.selectedItemName = item.name;
        this.moveItemDialog.open();
      }
    });
  }

  public onMoveItemDialogClosed(): void {
    this.selectedItemId = '';
    this.selectedItemName = '';
    this.isMoving = false;
  }

  public onMoveItemToBox(targetBoxId: string): void {
    if (this.selectedItemId && !this.isMoving) {
      this.isMoving = true;
      this.#firestoreService.moveItem(this.boxId, targetBoxId, this.selectedItemId).subscribe({
        next: () => {
          console.debug('Item moved successfully!');
          this.moveItemDialog.close();
          this.isMoving = false;
        },
        error: (error: unknown) => {
          console.error('Error moving item:', error);
          this.isMoving = false;
        }
      });
    }
  }
}
