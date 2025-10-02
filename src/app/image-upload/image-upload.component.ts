import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageService } from '../services/image.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'inv-image-upload',
  templateUrl: './image-upload.component.html',
  imports: [CommonModule],
})
export class ImageUploadComponent {
  @Input() imageUrl: string | null = null;
  @Input() boxId: string = '';
  @Input() itemId: string = '';
  @Output() imageUploaded = new EventEmitter<string>();
  @Output() imageRemoved = new EventEmitter<void>();

  readonly #imageService = inject(ImageService);

  protected isUploading = false;
  protected uploadError: string | null = null;

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.uploadImage(input.files[0]);
    }
  }

  protected onCameraClick(): void {
    // Open camera (will fall back to file picker on desktop)
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera on mobile
    input.addEventListener('change', (e) => this.onFileSelected(e));
    input.click();
  }

  protected onGalleryClick(): void {
    // Open gallery/file picker
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', (e) => this.onFileSelected(e));
    input.click();
  }

  protected onRemoveImage(): void {
    if (this.imageUrl) {
      this.isUploading = true;
      this.uploadError = null;
      
      this.#imageService.deleteItemImage(this.imageUrl)
        .pipe(finalize(() => this.isUploading = false))
        .subscribe({
          next: () => {
            this.imageUrl = null;
            this.imageRemoved.emit();
          },
          error: (error) => {
            console.error('Error removing image:', error);
            this.uploadError = 'Failed to remove image. Please try again.';
          }
        });
    }
  }

  private uploadImage(file: File): void {
    if (!this.boxId || !this.itemId) {
      this.uploadError = 'Cannot upload image: missing box or item ID';
      return;
    }

    this.isUploading = true;
    this.uploadError = null;

    // First resize the image to reduce storage usage
    this.#imageService.resizeImage(file)
      .then(resizedFile => {
        return this.#imageService.uploadItemImage(this.boxId, this.itemId, resizedFile).toPromise();
      })
      .then(downloadUrl => {
        if (downloadUrl) {
          this.imageUrl = downloadUrl;
          this.imageUploaded.emit(downloadUrl);
        }
      })
      .catch(error => {
        console.error('Error uploading image:', error);
        this.uploadError = 'Failed to upload image. Please try again.';
      })
      .finally(() => {
        this.isUploading = false;
      });
  }
}