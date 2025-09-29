import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Box, FirestoreService } from '../services/firestore.service';

@Component({
  selector: 'inv-box-form',
  templateUrl: './box-form.component.html',
  imports: [
    ReactiveFormsModule,
    RouterLink,
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
                  console.debug('Box updated successfully!');
                  this.#router.navigate(['/box', this.boxId]);
                },
                error: (error: unknown) => {
                  console.error('Error updating box:', error);
                  this.isSubmitting = false;
                }
              });
            } else {
              console.error('Box not found');
              this.isSubmitting = false;
            }
          },
          error: (error: unknown) => {
            console.error('Error fetching box for update:', error);
            this.isSubmitting = false;
          }
        });
      } else {
        // For new boxes, the service will add the userId automatically
        this.#firestoreService.addBox(boxData).subscribe({
          next: () => {
            console.debug('Box added successfully!');
            this.#router.navigate(['/boxes']);
          },
          error: (error: unknown) => {
            console.error('Error adding box:', error);
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
