import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable, map, startWith } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  #isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);
  
  constructor() {
    // Listen to online/offline events
    fromEvent(window, 'online').subscribe(() => {
      this.#isOnline$.next(true);
      console.log('📡 Connection restored - data will sync automatically');
    });
    
    fromEvent(window, 'offline').subscribe(() => {
      this.#isOnline$.next(false);
      console.log('📴 Offline mode - changes will be saved locally and synced when connection is restored');
    });
  }
  
  /**
   * Observable that emits true when online, false when offline
   */
  get isOnline$(): Observable<boolean> {
    return this.#isOnline$.asObservable();
  }
  
  /**
   * Current online status
   */
  get isOnline(): boolean {
    return this.#isOnline$.value;
  }
  
  /**
   * Observable that emits true when offline, false when online
   */
  get isOffline$(): Observable<boolean> {
    return this.#isOnline$.pipe(map(online => !online));
  }
  
  /**
   * Current offline status
   */
  get isOffline(): boolean {
    return !this.#isOnline$.value;
  }
}