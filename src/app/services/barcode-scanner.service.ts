import { inject, Injectable } from '@angular/core';
import { BarcodeDetector, DetectedBarcode } from 'barcode-detector';
import { from, Observable, Subject, switchMap } from 'rxjs';
import { PreferencesService } from './preferences.service';

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    BarcodeDetector?: typeof BarcodeDetector;
  }
}

@Injectable({
  providedIn: 'root',
})
export class BarcodeScannerService {
  readonly #preferencesService = inject(PreferencesService);

  readonly #barcodeScannedSubject = new Subject<Array<DetectedBarcode>>();
  public barcodesScanned$ = this.#barcodeScannedSubject.asObservable();

  #intervalId: number | undefined;
  #stream: MediaStream | undefined;

  public async startScan(options: { videoElement: HTMLVideoElement }): Promise<void> {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera access is not supported by this browser');
    }

    // Check if BarcodeDetector is available
    if (!('BarcodeDetector' in window)) {
      console.warn('BarcodeDetector not available, barcode detection may not work');
    }

    const constraints: MediaStreamConstraints = { audio: false };
    const defaultDeviceId = this.#preferencesService.getDefaultVideoDeviceId();

    if (defaultDeviceId) {
      constraints.video = {
        deviceId: defaultDeviceId,
      };
    } else {
      // Fall back to the environment facing mode if no default device is set
      constraints.video = {
        facingMode: {
          ideal: 'environment',
        },
      };
    }

    try {
      this.#stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      // If the default device failed, try fallback options
      if (defaultDeviceId && error instanceof DOMException && 
          (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError')) {
        console.warn('Default camera not found, trying fallback...');
        
        try {
          // Clear the invalid device ID from preferences
          this.#preferencesService.setDefaultVideoDeviceId('');
          
          // Try with environment facing mode
          const fallbackConstraints: MediaStreamConstraints = {
            audio: false,
            video: {
              facingMode: { ideal: 'environment' }
            }
          };
          
          this.#stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        } catch (fallbackError) {
          console.error('Fallback camera access also failed:', fallbackError);
          throw new Error(`Failed to access camera: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        throw new Error(`Failed to access camera: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    options.videoElement.srcObject = this.#stream;

    try {
      await options.videoElement.play();
    } catch (error) {
      console.error('Error playing video:', error);
      this.stopScan(); // Clean up the stream if video fails to play
      throw new Error(`Failed to start video playback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const barcodeDetector = new BarcodeDetector();
    await BarcodeDetector.getSupportedFormats()
      .then(formats => `Supported barcode formats: ${formats.join(', ')}`)
      .then(message => console.debug(message));

    this.#intervalId = window.setInterval(() => {
      void (async (): Promise<void> => {
        try {
          const barcodes = await barcodeDetector.detect(options.videoElement);

          if (barcodes.length === 0) {
            return;
          } else {
            this.#barcodeScannedSubject.next(barcodes);
          }
        } catch (error) {
          console.error('Error detecting barcodes:', error);
        }
      })();
    }, 200);
  }

  public stopScan(): void {
    if (this.#intervalId) {
      clearInterval(this.#intervalId);
      this.#intervalId = undefined;
    }

    if (this.#stream) {
      this.#stream.getTracks().forEach((track) => track.stop());
      this.#stream = undefined;
    }
  }

  public enumerateVideoDevices(): Observable<Array<MediaDeviceInfo>> {
    const permission = from(navigator.mediaDevices.getUserMedia({ video: true }));

    return permission.pipe(
      switchMap(
        () =>
          navigator.mediaDevices
            .enumerateDevices()
            .then((devices) => devices.filter((device) => device.kind === 'videoinput')),
      )
    );
  }
}