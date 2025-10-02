import { Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import QRCode from 'qrcode';

@Component({
  selector: 'inv-qr-code',
  templateUrl: './qr-code.component.html',
})
export class QrCodeComponent implements OnChanges {
  @ViewChild('qrCanvas', { static: true })
  private readonly canvas!: ElementRef<HTMLCanvasElement>;

  @Input() public data: string = '';
  @Input() public width: number = 256;
  @Input() public margin: number = 2;
  @Input() public errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M';

  public ngOnChanges(): void {
    if (this.data && this.canvas) {
      this.generateQRCode();
    }
  }

  private async generateQRCode(): Promise<void> {
    try {
      await QRCode.toCanvas(this.canvas.nativeElement, this.data, {
        width: this.width,
        margin: this.margin,
        errorCorrectionLevel: this.errorCorrectionLevel,
      });
    } catch (error) {
      console.error('QR Code generation failed:', error);
    }
  }
}