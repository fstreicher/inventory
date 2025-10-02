import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIconComponent } from '@ng-icons/core';
import { matArrowForward, matSync } from '@ng-icons/material-icons/baseline';
import { BreadcrumbComponent, type BreadcrumbItem } from '../breadcrumb/breadcrumb.component';
import { Box, FirestoreService, Item } from '../services/firestore.service';
import { ImageUploadComponent } from '../image-upload/image-upload.component';

@Component({
  selector: 'inv-item-form',
  templateUrl: './item-form.component.html',
  imports: [
    ReactiveFormsModule,
    NgIconComponent,
    BreadcrumbComponent,
    ImageUploadComponent,
  ],
})
export class ItemFormComponent implements OnInit {
  readonly #fb: FormBuilder = inject(FormBuilder);
  readonly #firestoreService: FirestoreService = inject(FirestoreService);
  readonly #route: ActivatedRoute = inject(ActivatedRoute);
  readonly #router: Router = inject(Router);

  // Signal-based state
  protected itemName = signal('');
  protected itemDescription = signal<string | null>(null);
  protected itemImageUrl = signal<string | null>(null);
  protected boxId = signal('');
  protected itemId = signal<string | null>(null);
  protected boxName = signal('');
  protected isSubmitting = signal(false);

  // Computed properties
  protected breadcrumbItems = computed((): Array<BreadcrumbItem> => [
    {
      label: this.boxName() || 'Box',
      link: ['/box', this.boxId()]
    },
    {
      label: this.itemId() ? 'Edit Item' : 'Add Item',
      isCurrentPage: true
    }
  ]);

  protected isFormValid = computed(() => {
    return this.itemName().trim().length > 0;
  });

  protected currentItem = computed((): Item => ({
    name: this.itemName(),
    description: this.itemDescription() || undefined,
    imageUrl: this.itemImageUrl() || undefined
  }));

  protected readonly ICONS = {
    chevronRight: matArrowForward,
    spinner: matSync
  };

  // Keep form for template binding compatibility
  protected itemForm: FormGroup<{
    name: FormControl<string>;
    description: FormControl<string | null>;
    imageUrl: FormControl<string | null>;
  }>;

  constructor() {
    this.itemForm = this.#fb.group({
      name: new FormControl('', { validators: [Validators.required], nonNullable: true }),
      description: new FormControl(''),
      imageUrl: new FormControl(''),
    });

    // Sync form values with signals
    this.itemForm.get('name')?.valueChanges.subscribe(value => {
      this.itemName.set(value || '');
    });

    this.itemForm.get('description')?.valueChanges.subscribe(value => {
      this.itemDescription.set(value);
    });

    this.itemForm.get('imageUrl')?.valueChanges.subscribe(value => {
      this.itemImageUrl.set(value);
    });
  }

  public ngOnInit(): void {
    this.boxId.set(this.#route.snapshot.paramMap.get('id') as string);
    this.itemId.set(this.#route.snapshot.paramMap.get('itemId'));

    // Load box information for breadcrumb
    this.#firestoreService.getBox(this.boxId()).subscribe((box: Box | undefined) => {
      if (box?.name) {
        this.boxName.set(box.name);
      }
    });

    if (this.itemId()) {
      this.#firestoreService.getItem(this.boxId(), this.itemId()!).subscribe((item: Item | undefined) => {
        if (item) {
          this.itemForm.patchValue(item);
          // Update signals with loaded item data
          this.itemName.set(item.name || '');
          this.itemDescription.set(item.description || null);
          this.itemImageUrl.set(item.imageUrl || null);
        }
      });
    }
  }

  protected onSubmit(): void {
    if (this.isFormValid() && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      const item = this.currentItem();

      if (this.itemId()) {
        // Updating existing item
        this.#firestoreService.updateItem(this.boxId(), { ...item, id: this.itemId()! }).subscribe({
          next: () => {
            console.debug('Item updated successfully!');
            this.#router.navigate(['/box', this.boxId()]);
          },
          error: (error: unknown) => {
            console.error('Error updating item:', error);
            this.isSubmitting.set(false);
          }
        });
      } else {
        // Adding new item - image is already uploaded with GUID, no need to move
        this.#firestoreService.addItem(this.boxId(), item).subscribe({
          next: () => {
            console.debug('Item added successfully!');
            this.#router.navigate(['/box', this.boxId()]);
          },
          error: (error: unknown) => {
            console.error('Error adding item:', error);
            this.isSubmitting.set(false);
          }
        });
      }
    }
  }

  protected cancel(): void {
    this.#router.navigate(['/box', this.boxId()]);
  }

  protected onImageUploaded(imageUrl: string): void {
    this.itemForm.patchValue({ imageUrl });
    this.itemImageUrl.set(imageUrl);
  }

  protected onImageRemoved(): void {
    this.itemForm.patchValue({ imageUrl: null });
    this.itemImageUrl.set(null);
  }

  protected get currentImageUrl(): string | null {
    return this.itemImageUrl();
  }
}
