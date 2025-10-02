import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  DocumentReference,
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  getDoc,
  query,
  updateDoc,
  where
} from '@angular/fire/firestore';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { EncryptionService } from './encryption.service';
import { OfflineService } from './offline.service';
import { ImageService } from './image.service';

export type Box = {
  id?: string;
  name: string;
  description?: string;
  userId: string;
}

export type Item = {
  id?: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  readonly #firestore: Firestore = inject(Firestore);
  readonly #auth: Auth = inject(Auth);
  readonly #offlineService = inject(OfflineService);
  readonly #encryptionService = inject(EncryptionService);
  readonly #imageService = inject(ImageService);
  readonly #boxesCollection = collection(this.#firestore, 'boxes');

  #getCurrentUserId(): string {
    const user = this.#auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.uid;
  }

  #handleOfflineError(error: unknown): Observable<never> {
    if (this.#offlineService.isOffline) {
      console.debug('📴 Operation queued for when connection is restored');
      // For offline operations, we can still throw the error but with a more user-friendly message
      return throwError(() => new Error('Operation saved locally and will sync when connection is restored'));
    }
    return throwError(() => error);
  }

  async #encryptBox(box: Box): Promise<Box> {
    return {
      name: await this.#encryptionService.encryptText(box.name),
      description: await this.#encryptionService.encryptText(box.description),
      userId: this.#getCurrentUserId()
    };
  }

  async #decryptBox(encryptedBox: Box): Promise<Box> {
    return {
      ...encryptedBox,
      name: await this.#encryptionService.decryptText(encryptedBox.name),
      description: await this.#encryptionService.decryptText(encryptedBox.description)
    };
  }

  async #encryptItem(item: Item): Promise<Item> {
    return {
      name: await this.#encryptionService.encryptText(item.name),
      description: await this.#encryptionService.encryptText(item.description),
      imageUrl: item.imageUrl // Image URLs don't need encryption as they're already secure Firebase URLs
    };
  }

  async #decryptItem(encryptedItem: Item): Promise<Item> {
    return {
      ...encryptedItem,
      name: await this.#encryptionService.decryptText(encryptedItem.name),
      description: await this.#encryptionService.decryptText(encryptedItem.description),
      imageUrl: encryptedItem.imageUrl // Image URLs don't need decryption
    };
  }

  public getBoxes(): Observable<Array<Box>> {
    const userId = this.#getCurrentUserId();
    const userBoxesQuery = query(this.#boxesCollection, where('userId', '==', userId));
    return (collectionData(userBoxesQuery, { idField: 'id' }) as Observable<Array<Box>>).pipe(
      switchMap(encryptedBoxes =>
        from(Promise.all(encryptedBoxes.map(box => this.#decryptBox(box))))),
      catchError(error => {
        console.debug('📦 Loading boxes from cache (offline mode)');
        return this.#handleOfflineError(error);
      })
    );
  }

  public getBox(id: string): Observable<Box | undefined> {
    const boxDocRef = doc(this.#firestore, `boxes/${id}`);
    return from(getDoc(boxDocRef)).pipe(
      switchMap(snapshot => {
        if (snapshot.exists()) {
          const encryptedBox = { id: snapshot.id, ...snapshot.data() as Box };
          // Verify the box belongs to the current user
          if (encryptedBox.userId !== this.#getCurrentUserId()) {
            throw new Error('Access denied: Box does not belong to current user');
          }
          return from(this.#decryptBox(encryptedBox));
        } else {
          return from(Promise.resolve(undefined));
        }
      })
    );
  }

  public addBox(box: Box): Observable<DocumentReference> {
    return from(this.#encryptBox(box)).pipe(
      switchMap(encryptedBox => {
        if (this.#offlineService.isOffline) {
          console.debug('📦 Box will be saved locally and synced when connection is restored');
        }
        return from(addDoc(this.#boxesCollection, encryptedBox));
      }),
      catchError(error => this.#handleOfflineError(error))
    );
  }

  public updateBox(box: Box): Observable<void> {
    // Verify the box belongs to the current user
    if (box.userId !== this.#getCurrentUserId()) {
      throw new Error('Access denied: Cannot update box that does not belong to current user');
    }
    const boxDocRef = doc(this.#firestore, `boxes/${box.id}`);
    return from(this.#encryptBox(box)).pipe(
      switchMap(encryptedBox => from(updateDoc(boxDocRef, encryptedBox)))
    );
  }

  public deleteBox(id: string): Observable<void> {
    return this.getBox(id).pipe(
      switchMap(box => {
        if (!box) {
          return throwError(() => new Error('Box not found'));
        }
        // Box ownership is already verified in getBox
        const boxDocRef = doc(this.#firestore, `boxes/${id}`);
        return from(deleteDoc(boxDocRef));
      })
    );
  }

  #verifyBoxOwnership(boxId: string): Observable<Box> {
    return this.getBox(boxId).pipe(
      map(box => {
        if (!box) {
          throw new Error('Box not found or access denied');
        }
        return box;
      })
    );
  }

  public getItems(boxId: string): Observable<Array<Item>> {
    return this.#verifyBoxOwnership(boxId).pipe(
      switchMap(() => {
        const itemsCollection = collection(this.#firestore, `boxes/${boxId}/items`);
        return (collectionData(itemsCollection, { idField: 'id' }) as Observable<Array<Item>>).pipe(
          switchMap(encryptedItems =>
            from(Promise.all(encryptedItems.map(item => this.#decryptItem(item)))))
        );
      })
    );
  }

  public getItem(boxId: string, itemId: string): Observable<Item | undefined> {
    return this.#verifyBoxOwnership(boxId).pipe(
      switchMap(() => {
        const itemDocRef = doc(this.#firestore, `boxes/${boxId}/items/${itemId}`);
        return from(getDoc(itemDocRef)).pipe(
          switchMap(snapshot => {
            if (snapshot.exists()) {
              const encryptedItem = { id: snapshot.id, ...snapshot.data() as Item };
              return from(this.#decryptItem(encryptedItem));
            } else {
              return from(Promise.resolve(undefined));
            }
          })
        );
      })
    );
  }

  public addItem(boxId: string, item: Item): Observable<DocumentReference> {
    return this.#verifyBoxOwnership(boxId).pipe(
      switchMap(() => {
        const itemsCollection = collection(this.#firestore, `boxes/${boxId}/items`);
        if (this.#offlineService.isOffline) {
          console.debug('📝 Item will be saved locally and synced when connection is restored');
        }
        return from(this.#encryptItem(item)).pipe(
          switchMap(encryptedItem => from(addDoc(itemsCollection, encryptedItem))),
          catchError(error => this.#handleOfflineError(error))
        );
      })
    );
  }

  public updateItem(boxId: string, item: Item): Observable<void> {
    return this.#verifyBoxOwnership(boxId).pipe(
      switchMap(() => {
        const itemDocRef = doc(this.#firestore, `boxes/${boxId}/items/${item.id}`);
        return from(this.#encryptItem(item)).pipe(
          switchMap(encryptedItem => from(updateDoc(itemDocRef, encryptedItem)))
        );
      })
    );
  }

  public deleteItem(boxId: string, itemId: string): Observable<void> {
    return this.#verifyBoxOwnership(boxId).pipe(
      switchMap(() => {
        // First get the item to check if it has an image
        return this.getItem(boxId, itemId).pipe(
          switchMap(item => {
            const itemDocRef = doc(this.#firestore, `boxes/${boxId}/items/${itemId}`);
            
            // Delete the item document first
            return from(deleteDoc(itemDocRef)).pipe(
              switchMap(() => {
                // If the item had an image, delete it from storage
                if (item?.imageUrl) {
                  return this.#imageService.deleteItemImage(item.imageUrl).pipe(
                    catchError(error => {
                      console.warn('Failed to delete item image:', error);
                      // Don't fail the whole operation if image deletion fails
                      return from(Promise.resolve());
                    })
                  );
                } else {
                  return from(Promise.resolve());
                }
              })
            );
          })
        );
      })
    );
  }
}
