import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { Box } from '../services/firestore.service';

@Component({
  selector: 'inv-move-item-dialog',
  templateUrl: './move-item-dialog.component.html',
  imports: [
    CommonModule,
  ],
})
export class MoveItemDialogComponent {
  @ViewChild('moveItemDialog') public moveItemDialog!: ElementRef<HTMLDialogElement>;

  @Input() public availableBoxes$!: Observable<Array<Box>>;
  @Input() public sourceBoxName?: string;
  @Input() public itemName?: string;
  @Input() public isMoving = false;

  @Output() public moveToBox = new EventEmitter<string>();
  @Output() public dialogClosed = new EventEmitter<void>();

  public open(): void {
    this.moveItemDialog.nativeElement.showModal();
  }

  public close(): void {
    this.moveItemDialog.nativeElement.close();
    this.dialogClosed.emit();
  }

  public onMoveToBox(targetBoxId: string): void {
    this.moveToBox.emit(targetBoxId);
  }
}