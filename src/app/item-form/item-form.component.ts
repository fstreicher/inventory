import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FirestoreService, Item, Box } from '../firestore.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './item-form.component.html',
  styleUrl: './item-form.component.css'
})
export class ItemFormComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  private firestoreService: FirestoreService = inject(FirestoreService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);

  itemForm: FormGroup;
  boxId: string = '';
  itemId: string | null = null;
  boxName: string = '';
  isSubmitting: boolean = false;

  constructor() {
    this.itemForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.boxId = this.route.snapshot.paramMap.get('id') as string;
    this.itemId = this.route.snapshot.paramMap.get('itemId');

    // Load box information for breadcrumb
    this.firestoreService.getBox(this.boxId).subscribe(box => {
      if (box) {
        this.boxName = box.name;
      }
    });

    if (this.itemId) {
      this.firestoreService.getItem(this.boxId, this.itemId).subscribe(item => {
        if (item) {
          this.itemForm.patchValue(item);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.itemForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const item: Item = this.itemForm.value;
      if (this.itemId) {
        this.firestoreService.updateItem(this.boxId, { ...item, id: this.itemId }).subscribe({
          next: () => {
            console.log('Item updated successfully!');
            this.router.navigate(['/box', this.boxId]);
          },
          error: (error) => {
            console.error('Error updating item:', error);
            this.isSubmitting = false;
          }
        });
      } else {
        this.firestoreService.addItem(this.boxId, item).subscribe({
          next: (docRef) => {
            console.log('Item added successfully!');
            this.router.navigate(['/box', this.boxId]);
          },
          error: (error) => {
            console.error('Error adding item:', error);
            this.isSubmitting = false;
          }
        });
      }
    }
  }

  cancel(): void {
    this.router.navigate(['/box', this.boxId]);
  }
}
