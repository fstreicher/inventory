import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, getDoc, addDoc, updateDoc, deleteDoc, DocumentReference } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Box {
  id?: string;
  name: string;
  description: string;
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
  private boxesCollection = collection(this.firestore, 'boxes');

  getBoxes(): Observable<Box[]> {
    return collectionData(this.boxesCollection, { idField: 'id' }) as Observable<Box[]>;
  }

  getBox(id: string): Observable<Box | undefined> {
    const boxDocRef = doc(this.firestore, `boxes/${id}`);
    return from(getDoc(boxDocRef)).pipe(
      map(snapshot => {
        if (snapshot.exists()) {
          return { id: snapshot.id, ...snapshot.data() } as Box;
        } else {
          return undefined;
        }
      })
    );
  }

  addBox(box: Box): Observable<DocumentReference> {
    return from(addDoc(this.boxesCollection, box));
  }

  updateBox(box: Box): Observable<void> {
    const boxDocRef = doc(this.firestore, `boxes/${box.id}`);
    return from(updateDoc(boxDocRef, box as any));
  }

  deleteBox(id: string): Observable<void> {
    const boxDocRef = doc(this.firestore, `boxes/${id}`);
    return from(deleteDoc(boxDocRef));
  }

  getItems(boxId: string): Observable<Item[]> {
    const itemsCollection = collection(this.firestore, `boxes/${boxId}/items`);
    return collectionData(itemsCollection, { idField: 'id' }) as Observable<Item[]>;
  }

  getItem(boxId: string, itemId: string): Observable<Item | undefined> {
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
  }

  addItem(boxId: string, item: Item): Observable<DocumentReference> {
    const itemsCollection = collection(this.firestore, `boxes/${boxId}/items`);
    return from(addDoc(itemsCollection, item));
  }

  updateItem(boxId: string, item: Item): Observable<void> {
    const itemDocRef = doc(this.firestore, `boxes/${boxId}/items/${item.id}`);
    return from(updateDoc(itemDocRef, item as any));
  }

  deleteItem(boxId: string, itemId: string): Observable<void> {
    const itemDocRef = doc(this.firestore, `boxes/${boxId}/items/${itemId}`);
    return from(deleteDoc(itemDocRef));
  }
}
