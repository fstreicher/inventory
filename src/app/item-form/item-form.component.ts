import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Box, FirestoreService, Item } from '../services/firestore.service';
import { ImageUploadComponent } from '../image-upload/image-upload.component';

@Component({
  selector: 'inv-item-form',
  templateUrl: './item-form.component.html',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ImageUploadComponent,
  ],
})
export class ItemFormComponent implements OnInit {
  readonly #fb: FormBuilder = inject(FormBuilder);
  readonly #firestoreService: FirestoreService = inject(FirestoreService);
  readonly #route: ActivatedRoute = inject(ActivatedRoute);
  readonly #router: Router = inject(Router);

  protected itemForm: FormGroup<{
    name: FormControl<string>;
    description: FormControl<string | null>;
    imageUrl: FormControl<string | null>;
  }>;
  protected boxId: string = '';
  protected itemId: string | null = null;
  protected boxName: string = '';
  protected isSubmitting: boolean = false;

  constructor() {
    this.itemForm = this.#fb.group({
      name: new FormControl('', { validators: [Validators.required], nonNullable: true }),
      description: new FormControl(''),
      imageUrl: new FormControl(''),
    });
  }

  public ngOnInit(): void {
    this.boxId = this.#route.snapshot.paramMap.get('id') as string;
    this.itemId = this.#route.snapshot.paramMap.get('itemId');

    // Load box information for breadcrumb
    this.#firestoreService.getBox(this.boxId).subscribe((box: Box | undefined) => {
      if (box) {
        this.boxName = box.name!;
      }
    });

    if (this.itemId) {
      this.#firestoreService.getItem(this.boxId, this.itemId).subscribe((item: Item | undefined) => {
        if (item) {
          this.itemForm.patchValue(item);
        }
      });
    }
  }

  protected onSubmit(): void {
    if (this.itemForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const item = this.itemForm.value as Item;
      if (this.itemId) {
        this.#firestoreService.updateItem(this.boxId, { ...item, id: this.itemId }).subscribe({
          next: () => {
            console.debug('Item updated successfully!');
            this.#router.navigate(['/box', this.boxId]);
          },
          error: (error: unknown) => {
            console.error('Error updating item:', error);
            this.isSubmitting = false;
          }
        });
      } else {
        this.#firestoreService.addItem(this.boxId, item).subscribe({
          next: () => {
            console.debug('Item added successfully!');
            this.#router.navigate(['/box', this.boxId]);
          },
          error: (error: unknown) => {
            console.error('Error adding item:', error);
            this.isSubmitting = false;
          }
        });
      }
    }
  }

  protected cancel(): void {
    this.#router.navigate(['/box', this.boxId]);
  }

  protected onImageUploaded(imageUrl: string): void {
    this.itemForm.patchValue({ imageUrl });
  }

  protected onImageRemoved(): void {
    this.itemForm.patchValue({ imageUrl: null });
  }

  protected get currentImageUrl(): string | null {
    return this.itemForm.get('imageUrl')?.value || null;
  }
}
