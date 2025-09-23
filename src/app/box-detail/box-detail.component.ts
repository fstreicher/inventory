import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FirestoreService, Box, Item } from '../firestore.service';
import { Observable, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-box-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './box-detail.component.html',
  styleUrl: './box-detail.component.css'
})
export class BoxDetailComponent {
  private firestoreService: FirestoreService = inject(FirestoreService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);

  box$: Observable<Box | undefined> = this.route.paramMap.pipe(
    switchMap(params => this.firestoreService.getBox(params.get('id') as string))
  );

  items$: Observable<Item[]> = this.route.paramMap.pipe(
    switchMap(params => this.firestoreService.getItems(params.get('id') as string))
  );

  boxId: string = '';

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.boxId = params.get('id') as string;
    });
  }

  deleteBox(boxId: string | undefined): void {
    if (boxId && confirm('Are you sure you want to delete this box and all its contents?')) {
      this.firestoreService.deleteBox(boxId).subscribe(() => {
        console.log('Box deleted successfully!');
        this.router.navigate(['/boxes']);
      });
    }
  }

  deleteItem(itemId: string | undefined): void {
    if (itemId && confirm('Are you sure you want to delete this item?')) {
      this.firestoreService.deleteItem(this.boxId, itemId).subscribe(() => {
        console.log('Item deleted successfully!');
      });
    }
  }
}
