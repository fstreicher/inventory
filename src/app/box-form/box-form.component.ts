import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIconComponent } from '@ng-icons/core';
import { matArrowForwardIos, matSync } from '@ng-icons/material-icons/baseline';
import { toast } from 'ngx-sonner';
import { BreadcrumbComponent, type BreadcrumbItem } from '../breadcrumb/breadcrumb.component';
import { Box, FirestoreService } from '../services/firestore.service';

@Component({
  selector: 'inv-box-form',
  templateUrl: './box-form.component.html',
  imports: [
    ReactiveFormsModule,
    NgIconComponent,
    BreadcrumbComponent,
  ],
})
export class BoxFormComponent implements OnInit {
  readonly #fb: FormBuilder = inject(FormBuilder);
  readonly #firestoreService: FirestoreService = inject(FirestoreService);
  readonly #route: ActivatedRoute = inject(ActivatedRoute);
  readonly #router: Router = inject(Router);

  protected boxForm: FormGroup;
  protected boxId: string | null = null;
  protected isSubmitting: boolean = false;

  protected get breadcrumbItems(): Array<BreadcrumbItem> {
    return [
      {
        label: this.boxId ? 'Edit Box' : 'Add Box',
        isCurrentPage: true
      }
    ];
  }

  protected readonly ICONS = {
    chevronRight: matArrowForwardIos,
    spinner: matSync
  };

  constructor() {
    this.boxForm = this.#fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  public ngOnInit(): void {
    this.boxId = this.#route.snapshot.paramMap.get('id');
    if (this.boxId) {
      this.#firestoreService.getBox(this.boxId).subscribe((box: Box | undefined) => {
        if (box) {
          this.boxForm.patchValue(box);
        }
      });
    }
  }

  protected onSubmit(): void {
    if (this.boxForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const boxData = this.boxForm.value as Box;

      if (this.boxId) {
        // For updates, we need to preserve the existing userId and id
        this.#firestoreService.getBox(this.boxId).subscribe({
          next: (existingBox: Box | undefined) => {
            if (existingBox) {
              const updatedBox: Box = {
                ...existingBox,
                ...boxData,
                id: this.boxId!
              };
              this.#firestoreService.updateBox(updatedBox).subscribe({
                next: () => {
                  toast.success('Box updated successfully');
                  this.#router.navigate(['/box', this.boxId]);
                },
                error: (error: unknown) => {
                  console.error('Error updating box:', error);
                  toast.error('Failed to update box');
                  this.isSubmitting = false;
                }
              });
            } else {
              console.error('Box not found');
              toast.error('Box not found');
              this.isSubmitting = false;
            }
          },
          error: (error: unknown) => {
            console.error('Error fetching box for update:', error);
            toast.error('Failed to load box data');
            this.isSubmitting = false;
          }
        });
      } else {
        // For new boxes, the service will add the userId automatically
        this.#firestoreService.addBox(boxData).subscribe({
          next: () => {
            toast.success('Box created successfully');
            this.#router.navigate(['/boxes']);
          },
          error: (error: unknown) => {
            console.error('Error adding box:', error);
            toast.error('Failed to create box');
            this.isSubmitting = false;
          }
        });
      }
    }
  }

  protected cancel(): void {
    if (this.boxId) {
      this.#router.navigate(['/box', this.boxId]);
    } else {
      this.#router.navigate(['/boxes']);
    }
  }
}
