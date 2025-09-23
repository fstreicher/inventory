import { Component, inject } from '@angular/core';
import { FirestoreService, Box } from '../firestore.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-box-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './box-list.component.html',
  styleUrl: './box-list.component.css'
})
export class BoxListComponent {
  private firestoreService: FirestoreService = inject(FirestoreService);
  boxes$: Observable<Box[]> = this.firestoreService.getBoxes();
}
