import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Storage, deleteObject, getDownloadURL, ref, uploadBytes } from '@angular/fire/storage';
import { Observable, from, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  readonly #storage: Storage = inject(Storage);
  readonly #auth: Auth = inject(Auth);

  #getCurrentUserId(): string {
    const user = this.#auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.uid;
  }

  /**
   * Uploads an image to Firebase Storage using a GUID and returns the download URL
   */
  public uploadItemImage(boxId: string, file: File): Observable<string> {
    if (!file) {
      return throwError(() => new Error('No file provided'));
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return throwError(() => new Error('File must be an image'));
    }

    // Create a unique GUID-based path for the image
    const userId = this.#getCurrentUserId();
    const imageId = crypto.randomUUID();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${imageId}.${fileExtension}`;
    const imagePath = `users/${userId}/boxes/${boxId}/${fileName}`;

    const imageRef = ref(this.#storage, imagePath);

    return from(uploadBytes(imageRef, file)).pipe(
      switchMap(() => from(getDownloadURL(imageRef)))
    );
  }

  /**
   * Deletes an image from Firebase Storage using the image URL
   */
  public deleteItemImage(imageUrl: string): Observable<void> {
    if (!imageUrl) {
      return throwError(() => new Error('No image URL provided'));
    }

    try {
      // Extract storage path from the download URL
      // Firebase Storage URLs have format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?{params}
      const urlParts = imageUrl.split('/o/')[1]?.split('?')[0];
      if (!urlParts) {
        return throwError(() => new Error('Invalid image URL format'));
      }

      // Decode the path (Firebase encodes paths in URLs)
      const imagePath = decodeURIComponent(urlParts);
      const imageRef = ref(this.#storage, imagePath);
      return from(deleteObject(imageRef));
    } catch (error) {
      return throwError(() => error);
    }
  }

  /**
   * Resizes an image file to reduce storage usage
   */
  public resizeImage(file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = (): void => {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress the image
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              }));
            } else {
              reject(new Error('Failed to resize image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = (): void => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}