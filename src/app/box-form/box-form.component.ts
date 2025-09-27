import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FirestoreService, Box } from '../firestore.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'inv-box-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './box-form.component.html',
  styleUrl: './box-form.component.css'
})
export class BoxFormComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  private firestoreService: FirestoreService = inject(FirestoreService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);

  boxForm: FormGroup;
  boxId: string | null = null;
  isSubmitting: boolean = false;

  constructor() {
    this.boxForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.boxId = this.route.snapshot.paramMap.get('id');
    if (this.boxId) {
      this.firestoreService.getBox(this.boxId).subscribe(box => {
        if (box) {
          this.boxForm.patchValue(box);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.boxForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const boxData = this.boxForm.value;
      
      if (this.boxId) {
        // For updates, we need to preserve the existing userId and id
        this.firestoreService.getBox(this.boxId).subscribe({
          next: (existingBox) => {
            if (existingBox) {
              const updatedBox: Box = {
                ...existingBox,
                ...boxData,
                id: this.boxId!
              };
              this.firestoreService.updateBox(updatedBox).subscribe({
                next: () => {
                  console.log('Box updated successfully!');
                  this.router.navigate(['/box', this.boxId]);
                },
                error: (error) => {
                  console.error('Error updating box:', error);
                  this.isSubmitting = false;
                }
              });
            } else {
              console.error('Box not found');
              this.isSubmitting = false;
            }
          },
          error: (error) => {
            console.error('Error fetching box for update:', error);
            this.isSubmitting = false;
          }
        });
      } else {
        // For new boxes, the service will add the userId automatically
        this.firestoreService.addBox(boxData).subscribe({
          next: (docRef) => {
            console.log('Box added successfully!');
            this.router.navigate(['/boxes']);
          },
          error: (error) => {
            console.error('Error adding box:', error);
            this.isSubmitting = false;
          }
        });
      }
    }
  }

  cancel(): void {
    if (this.boxId) {
      this.router.navigate(['/box', this.boxId]);
    } else {
      this.router.navigate(['/boxes']);
    }
  }
}
