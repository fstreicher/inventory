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
      const box: Box = this.boxForm.value;
      if (this.boxId) {
        this.firestoreService.updateBox({ ...box, id: this.boxId }).subscribe({
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
        this.firestoreService.addBox(box).subscribe({
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
