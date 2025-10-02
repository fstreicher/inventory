import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { NgIconComponent } from '@ng-icons/core';
import {
  matCameraAlt,
  matClose,
  matImage,
  matPhotoCamera,
  matSync,
  matWarning
} from '@ng-icons/material-icons/baseline';
import { finalize } from 'rxjs/operators';
import { ImageService } from '../services/image.service';

@Component({
  selector: 'inv-image-upload',
  templateUrl: './image-upload.component.html',
  imports: [CommonModule, NgIconComponent],
})
export class ImageUploadComponent {
  readonly #imageService = inject(ImageService);

  protected readonly ICONS = {
    close: matClose,
    spinner: matSync,
    camera: matCameraAlt,
    image: matImage,
    warning: matWarning,
    photoCamera: matPhotoCamera
  };

  protected isUploading = signal(false);
  protected uploadError = signal<string | null>(null);
  protected currentImageUrl = signal<string | null>(null);

  public imageUrl = input<string | null>(null);
  public boxId = input<string | null>(null);
  public itemId = input<string | null>(null);
  public imageUploaded = output<string>();
  public imageRemoved = output<void>();

  constructor() {
    // Sync input signal with internal signal
    effect(() => {
      this.currentImageUrl.set(this.imageUrl());
    });
  }

  // Getter for template to use the current image URL
  protected get displayImageUrl(): string | null {
    return this.currentImageUrl();
  }


  protected onFileSelected(event: Event): void {
    const inputFile = event.target as HTMLInputElement;
    if (inputFile.files?.[0]) {
      this.uploadImage(inputFile.files[0]);
    }
  }

  protected onCameraClick(): void {
    // Open camera (will fall back to file picker on desktop)
    const inputFile = document.createElement('input');
    inputFile.type = 'file';
    inputFile.accept = 'image/*';
    inputFile.capture = 'environment'; // Use rear camera on mobile
    inputFile.addEventListener('change', (e) => this.onFileSelected(e));
    inputFile.click();
  }

  protected onGalleryClick(): void {
    // Open gallery/file picker
    const inputFile = document.createElement('input');
    inputFile.type = 'file';
    inputFile.accept = 'image/*';
    inputFile.addEventListener('change', (e) => this.onFileSelected(e));
    inputFile.click();
  }

  protected onRemoveImage(): void {
    if (this.currentImageUrl()) {
      this.isUploading.set(true);
      this.uploadError.set(null);

      this.#imageService.deleteItemImage(this.currentImageUrl()!)
        .pipe(finalize(() => this.isUploading.set(false)))
        .subscribe({
          next: () => {
            this.currentImageUrl.set(null);
            this.imageRemoved.emit();
          },
          error: (error) => {
            console.error('Error removing image:', error);
            this.uploadError.set('Failed to remove image. Please try again.');
          }
        });
    }
  }

  private uploadImage(file: File): void {
    const currentBoxId = this.boxId();
    if (!currentBoxId) {
      this.uploadError.set('Cannot upload image: missing box ID');
      return;
    }

    this.isUploading.set(true);
    this.uploadError.set(null);

    // Store reference to old image URL for cleanup
    const oldImageUrl = this.currentImageUrl();

    // First resize the image to reduce storage usage
    this.#imageService.resizeImage(file)
      .then(resizedFile => {
        return this.#imageService.uploadItemImage(currentBoxId, resizedFile).toPromise();
      })
      .then(downloadUrl => {
        if (downloadUrl) {
          this.currentImageUrl.set(downloadUrl);
          this.imageUploaded.emit(downloadUrl);
          
          // Clean up old image if it exists and is different from the new one
          if (oldImageUrl && oldImageUrl !== downloadUrl) {
            this.#imageService.deleteItemImage(oldImageUrl).subscribe({
              next: () => console.debug('Old image cleaned up successfully'),
              error: (error) => console.warn('Failed to clean up old image:', error)
            });
          }
        }
      })
      .catch(error => {
        console.error('Error uploading image:', error);
        this.uploadError.set('Failed to upload image. Please try again.');
      })
      .finally(() => {
        this.isUploading.set(false);
      });
  }
}