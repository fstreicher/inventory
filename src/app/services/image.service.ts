import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

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
   * Uploads an image to Firebase Storage and returns the download URL
   */
  public uploadItemImage(boxId: string, itemId: string, file: File): Observable<string> {
    if (!file) {
      return throwError(() => new Error('No file provided'));
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return throwError(() => new Error('File must be an image'));
    }

    // Create a unique path for the image
    const userId = this.#getCurrentUserId();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}.${fileExtension}`;
    const imagePath = `users/${userId}/boxes/${boxId}/items/${itemId}/${fileName}`;
    
    const imageRef = ref(this.#storage, imagePath);

    return from(uploadBytes(imageRef, file)).pipe(
      switchMap(() => from(getDownloadURL(imageRef)))
    );
  }

  /**
   * Moves an image from a temporary path to a final path (used when saving new items)
   */
  public moveItemImage(imageUrl: string, boxId: string, finalItemId: string): Observable<string> {
    if (!imageUrl || !imageUrl.includes('temp_')) {
      // Image is already in final location or doesn't exist
      return from(Promise.resolve(imageUrl));
    }

    try {
      // Extract the temp path from the URL
      const tempRef = ref(this.#storage, imageUrl);
      
      // Create new path with final item ID
      const userId = this.#getCurrentUserId();
      const fileExtension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `${Date.now()}.${fileExtension}`;
      const finalPath = `users/${userId}/boxes/${boxId}/items/${finalItemId}/${fileName}`;
      const finalRef = ref(this.#storage, finalPath);

      // Download the file and re-upload to final location
      return from(getDownloadURL(tempRef)).pipe(
        switchMap(url => from(fetch(url))),
        switchMap(response => from(response.blob())),
        switchMap(blob => from(uploadBytes(finalRef, blob))),
        switchMap(() => from(getDownloadURL(finalRef))),
        switchMap((newUrl: string) => {
          // Delete the temporary file
          return from(deleteObject(tempRef)).pipe(
            map(() => newUrl),
            catchError(() => from(Promise.resolve(newUrl))) // Don't fail if temp deletion fails
          );
        })
      );
    } catch (error) {
      return throwError(() => error);
    }
  }

  /**
   * Deletes an image from Firebase Storage
   */
  public deleteItemImage(imageUrl: string): Observable<void> {
    if (!imageUrl) {
      return throwError(() => new Error('No image URL provided'));
    }

    try {
      const imageRef = ref(this.#storage, imageUrl);
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

      img.onload = () => {
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

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}