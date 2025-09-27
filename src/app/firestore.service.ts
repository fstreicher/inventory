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
import { OfflineService } from './offline.service';

export interface Box {
  id?: string;
  name: string;
  description: string;
  userId: string;
}

export interface Item {
  id?: string;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);
  private offlineService = inject(OfflineService);
  private boxesCollection = collection(this.firestore, 'boxes');

  private getCurrentUserId(): string {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.uid;
  }

  private handleOfflineError(error: any): Observable<never> {
    if (this.offlineService.isOffline) {
      console.log('📴 Operation queued for when connection is restored');
      // For offline operations, we can still throw the error but with a more user-friendly message
      return throwError(() => new Error('Operation saved locally and will sync when connection is restored'));
    }
    return throwError(() => error);
  }

  getBoxes(): Observable<Array<Box>> {
    const userId = this.getCurrentUserId();
    const userBoxesQuery = query(this.boxesCollection, where('userId', '==', userId));
    return (collectionData(userBoxesQuery, { idField: 'id' }) as Observable<Array<Box>>).pipe(
      catchError(error => {
        console.log('📦 Loading boxes from cache (offline mode)');
        return this.handleOfflineError(error);
      })
    );
  }

  getBox(id: string): Observable<Box | undefined> {
    const boxDocRef = doc(this.firestore, `boxes/${id}`);
    return from(getDoc(boxDocRef)).pipe(
      map(snapshot => {
        if (snapshot.exists()) {
          const box = { id: snapshot.id, ...snapshot.data() } as Box;
          // Verify the box belongs to the current user
          if (box.userId !== this.getCurrentUserId()) {
            throw new Error('Access denied: Box does not belong to current user');
          }
          return box;
        } else {
          return undefined;
        }
      })
    );
  }

  addBox(box: Omit<Box, 'userId'>): Observable<DocumentReference> {
    const boxWithUser = { ...box, userId: this.getCurrentUserId() };
    if (this.offlineService.isOffline) {
      console.log('📦 Box will be saved locally and synced when connection is restored');
    }
    return from(addDoc(this.boxesCollection, boxWithUser)).pipe(
      catchError(error => this.handleOfflineError(error))
    );
  }

  updateBox(box: Box): Observable<void> {
    // Verify the box belongs to the current user
    if (box.userId !== this.getCurrentUserId()) {
      throw new Error('Access denied: Cannot update box that does not belong to current user');
    }
    const boxDocRef = doc(this.firestore, `boxes/${box.id}`);
    return from(updateDoc(boxDocRef, box as any));
  }

  deleteBox(id: string): Observable<void> {
    return this.getBox(id).pipe(
      switchMap(box => {
        if (!box) {
          return throwError(() => new Error('Box not found'));
        }
        // Box ownership is already verified in getBox
        const boxDocRef = doc(this.firestore, `boxes/${id}`);
        return from(deleteDoc(boxDocRef));
      })
    );
  }

  private verifyBoxOwnership(boxId: string): Observable<Box> {
    return this.getBox(boxId).pipe(
      map(box => {
        if (!box) {
          throw new Error('Box not found or access denied');
        }
        return box;
      })
    );
  }

  getItems(boxId: string): Observable<Array<Item>> {
    return this.verifyBoxOwnership(boxId).pipe(
      switchMap(() => {
        const itemsCollection = collection(this.firestore, `boxes/${boxId}/items`);
        return collectionData(itemsCollection, { idField: 'id' }) as Observable<Array<Item>>;
      })
    );
  }

  getItem(boxId: string, itemId: string): Observable<Item | undefined> {
    return this.verifyBoxOwnership(boxId).pipe(
      switchMap(() => {
        const itemDocRef = doc(this.firestore, `boxes/${boxId}/items/${itemId}`);
        return from(getDoc(itemDocRef)).pipe(
          map(snapshot => {
            if (snapshot.exists()) {
              return { id: snapshot.id, ...snapshot.data() } as Item;
            } else {
              return undefined;
            }
          })
        );
      })
    );
  }

  addItem(boxId: string, item: Item): Observable<DocumentReference> {
    return this.verifyBoxOwnership(boxId).pipe(
      switchMap(() => {
        const itemsCollection = collection(this.firestore, `boxes/${boxId}/items`);
        if (this.offlineService.isOffline) {
          console.log('📝 Item will be saved locally and synced when connection is restored');
        }
        return from(addDoc(itemsCollection, item)).pipe(
          catchError(error => this.handleOfflineError(error))
        );
      })
    );
  }

  updateItem(boxId: string, item: Item): Observable<void> {
    return this.verifyBoxOwnership(boxId).pipe(
      switchMap(() => {
        const itemDocRef = doc(this.firestore, `boxes/${boxId}/items/${item.id}`);
        return from(updateDoc(itemDocRef, item as any));
      })
    );
  }

  deleteItem(boxId: string, itemId: string): Observable<void> {
    return this.verifyBoxOwnership(boxId).pipe(
      switchMap(() => {
        const itemDocRef = doc(this.firestore, `boxes/${boxId}/items/${itemId}`);
        return from(deleteDoc(itemDocRef));
      })
    );
  }
}
