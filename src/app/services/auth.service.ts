import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { EncryptionService } from './encryption.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly #auth: Auth = inject(Auth);
  readonly #router: Router = inject(Router);
  readonly #encryptionService = inject(EncryptionService);

  // Observable of the current user
  public user$: Observable<User | null> = user(this.#auth);

  constructor() {
    // Subscribe to auth state changes
    this.user$.subscribe(firebaseUser => {
      if (firebaseUser) {
        console.debug('User signed in:', firebaseUser.displayName);
      } else {
        console.debug('User signed out');
      }
    });
  }

  public async signInWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(this.#auth, provider);
      console.debug('Sign in successful:', result.user.displayName);

      // Redirect to main app after successful login
      this.#router.navigate(['/boxes']);
    } catch (error: unknown) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }

  public async signOut(): Promise<void> {
    try {
      // Clear encryption keys before signing out
      this.#encryptionService.clearKeyCache();

      await signOut(this.#auth);
      console.debug('Sign out successful');

      // Redirect to login page
      this.#router.navigate(['/login']);
    } catch (error: unknown) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  public getCurrentUser(): User | null {
    return this.#auth.currentUser;
  }

  public isAuthenticated(): boolean {
    return this.#auth.currentUser !== null;
  }
}