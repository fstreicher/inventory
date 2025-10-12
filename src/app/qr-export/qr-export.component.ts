import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Output, ViewChild, inject, signal } from '@angular/core';
import { NgIconComponent } from '@ng-icons/core';
import { matClose, matPrint } from '@ng-icons/material-icons/baseline';
import QRCode from 'qrcode';
import { Box, FirestoreService } from '../services/firestore.service';

type QRCodeData = {
  box: Box;
  qrCodeDataUrl: string;
};

@Component({
  selector: 'inv-qr-export',
  templateUrl: './qr-export.component.html',
  styleUrl: './qr-export.component.css',
  imports: [CommonModule, NgIconComponent],
})
export class QrExportComponent {
  protected readonly ICONS = {
    close: matClose,
    print: matPrint,
  };

  protected qrCodes = signal<Array<QRCodeData>>([]);
  protected loading = signal(false);
  protected error = signal<string | null>(null);

  @ViewChild('qrExportDialog') public qrExportDialog!: ElementRef<HTMLDialogElement>;
  
  @Output() public dialogClosed = new EventEmitter<void>();

  readonly #firestoreService = inject(FirestoreService);

  public async open(): Promise<void> {
    this.qrExportDialog.nativeElement.showModal();
    await this.loadQRCodes();
  }

  public close(): void {
    this.qrExportDialog.nativeElement.close();
    this.dialogClosed.emit();
    // Reset state when closing
    this.qrCodes.set([]);
    this.loading.set(false);
    this.error.set(null);
  }

  private async loadQRCodes(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      const boxes = await this.#firestoreService.getBoxesOnce();
      
      if (boxes.length === 0) {
        this.error.set('No boxes found. Create some boxes first!');
        this.loading.set(false);
        return;
      }

      const qrCodePromises = boxes.map(async (box: Box) => {
        const url = `${window.location.origin}/box/${box.id ?? ''}`;
        const qrCodeDataUrl = await QRCode.toDataURL(url, {
          width: 400,
          margin: 2,
          errorCorrectionLevel: 'M',
        });

        return {
          box,
          qrCodeDataUrl,
        };
      });

      const qrCodes = await Promise.all(qrCodePromises);
      this.qrCodes.set(qrCodes);
      this.loading.set(false);
    } catch (err) {
      console.error('Failed to generate QR codes:', err);
      this.error.set('Failed to generate QR codes. Please try again.');
      this.loading.set(false);
    }
  }

  protected print(): void {
    window.print();
  }
}
