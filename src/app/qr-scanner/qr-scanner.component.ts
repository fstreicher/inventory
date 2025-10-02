import { AfterViewInit, Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NgIconComponent } from '@ng-icons/core';
import { matClose } from '@ng-icons/material-icons/baseline';
import { defaultIfEmpty, filter, lastValueFrom, map, take } from 'rxjs';
import { DetectedBarcode, Point2D } from '../../types';
import { BarcodeScannerService } from '../services/barcode-scanner.service';

@Component({
  selector: 'inv-qr-scanner',
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.css'],
  imports: [NgIconComponent],
})
export class QrScannerComponent implements AfterViewInit {
  readonly #barcodeScannerService = inject(BarcodeScannerService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #router = inject(Router);

  protected readonly ICONS = {
    close: matClose,
  };

  protected readonly cutout = viewChild.required<ElementRef<HTMLDivElement>>('cutout');
  protected readonly videoElementRef = viewChild.required<ElementRef<HTMLVideoElement>>('video');

  public ngAfterViewInit(): void {
    this.#scan();
  }

  protected async close(): Promise<void> {
    this.#stopScan();
    await this.#router.navigate(['/']);
  }

  #calculateDetectionCornerPoints(squareElementBoundingClientRect: DOMRect): [Point2D, Point2D, Point2D, Point2D] {
    const scaledRect = {
      left: squareElementBoundingClientRect.left * window.devicePixelRatio,
      right: squareElementBoundingClientRect.right * window.devicePixelRatio,
      top: squareElementBoundingClientRect.top * window.devicePixelRatio,
      bottom: squareElementBoundingClientRect.bottom * window.devicePixelRatio,
      width: squareElementBoundingClientRect.width * window.devicePixelRatio,
      height: squareElementBoundingClientRect.height * window.devicePixelRatio,
    };

    const detectionCornerPoints: [Point2D, Point2D, Point2D, Point2D] = [
      { x: scaledRect.left, y: scaledRect.top },
      { x: scaledRect.left + scaledRect.width, y: scaledRect.top },
      { x: scaledRect.left + scaledRect.width, y: scaledRect.top + scaledRect.height },
      { x: scaledRect.left, y: scaledRect.top + scaledRect.height },
    ];

    return detectionCornerPoints;
  }

  #filterBarcodesOutsideDetectionZone(
    barcodes: Array<DetectedBarcode>,
    detectionCornerPoints: [Point2D, Point2D, Point2D, Point2D],
  ): Array<DetectedBarcode> {
    const filteredBarcodes = [];

    for (const barcode of barcodes) {
      if (this.#isBarcodeInsideDetectionZone(barcode, detectionCornerPoints)) {
        filteredBarcodes.push(barcode);
      }
    }

    return filteredBarcodes;
  }

  #isBarcodeInsideDetectionZone(
    barcode: DetectedBarcode,
    detectionCornerPoints: [Point2D, Point2D, Point2D, Point2D],
    tolerance: number = 25,
  ): boolean {
    const barcodeCornerPoints = barcode.cornerPoints;

    if (!detectionCornerPoints || !barcodeCornerPoints) {
      // Optimistic return
      return true;
    }

    return (
      detectionCornerPoints[0].x - tolerance > barcodeCornerPoints[0].x || // Top-left
      detectionCornerPoints[0].y - tolerance > barcodeCornerPoints[0].y ||
      detectionCornerPoints[1].x + tolerance < barcodeCornerPoints[1].x || // Top-right
      detectionCornerPoints[1].y - tolerance > barcodeCornerPoints[1].y ||
      detectionCornerPoints[2].x + tolerance < barcodeCornerPoints[2].x || // Bottom-right
      detectionCornerPoints[2].y + tolerance < barcodeCornerPoints[2].y ||
      detectionCornerPoints[3].x - tolerance > barcodeCornerPoints[3].x || // Bottom-left
      detectionCornerPoints[3].y + tolerance < barcodeCornerPoints[3].y
    );
  }

  async #scan(): Promise<void> {
    try {
      await this.#startScan();

      // Calculate the detection corner points of the detection zone
      const cutoutElementBoundingClientRect = this.cutout().nativeElement.getBoundingClientRect();
      const detectionCornerPoints = this.#calculateDetectionCornerPoints(cutoutElementBoundingClientRect);

      // Wait for the first barcode to be scanned
      const scannedBarcode = await lastValueFrom(
        this.#barcodeScannerService.barcodesScanned$.pipe(
          // Filter out barcodes outside the detection zone
          map((barcodes) => this.#filterBarcodesOutsideDetectionZone(barcodes, detectionCornerPoints)),
          // Filter out empty barcode arrays
          filter((barcodes) => barcodes.length > 0),
          // Map the barcodes to the first barcode
          map((barcodes) => barcodes[0]),
          // Scan is canceled by user
          takeUntilDestroyed(this.#destroyRef),
          // Take the first scanned barcode
          take(1),
          // Return undefined on cancel
          defaultIfEmpty(undefined),
        ),
      );

      if (scannedBarcode) {
        try {
          this.#stopScan();
          console.debug('Scanned barcode:', scannedBarcode.rawValue);

          // Navigate to the scanned URL or handle the barcode data
          if (scannedBarcode.rawValue.startsWith('http')) {
            await this.#router.navigateByUrl(scannedBarcode.rawValue);
          } else {
            console.debug('Scanned non-URL barcode:', scannedBarcode.rawValue);
            await this.#router.navigate(['/']);
          }
        } catch (error) {
          console.error('Error processing scanned barcode:', error);
          await this.#router.navigate(['/']);
        }
      } else {
        await this.#router.navigate(['/']);
      }
    } catch (error) {
      console.error('Error starting camera scan:', error);

      // Provide more specific error messages based on the error type
      let errorMessage = 'Unable to access camera. ';

      if (error instanceof Error) {
        if (error.message.includes('Permission denied') || error.message.includes('NotAllowedError')) {
          errorMessage += 'Please allow camera access in your browser settings and try again.';
        } else if (error.message.includes('NotFoundError') || error.message.includes('DevicesNotFoundError')) {
          errorMessage += 'No camera found. Please connect a camera and try again.';
        } else if (error.message.includes('not supported')) {
          errorMessage += 'Camera access is not supported by this browser.';
        } else {
          errorMessage += 'Please check your camera permissions and try again.';
        }
      } else {
        errorMessage += 'Please check your camera permissions and try again.';
      }

      alert(errorMessage);
      await this.#router.navigate(['/']);
    }
  }

  async #startScan(): Promise<void> {
    const videoElement = this.videoElementRef().nativeElement;

    await this.#barcodeScannerService.startScan({
      videoElement,
    });
  }

  #stopScan(): void {
    this.#barcodeScannerService.stopScan();
  }
}
