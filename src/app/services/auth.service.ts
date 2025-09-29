import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { EncryptionService } from './encryption.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  #auth: Auth = inject(Auth);
  #router: Router = inject(Router);
  #encryptionService = inject(EncryptionService);
  
  // Observable of the current user
  public user$: Observable<User | null> = user(this.#auth);
  
  constructor() {
    // Subscribe to auth state changes
    this.user$.subscribe(user => {
      if (user) {
        console.log('User signed in:', user.displayName);
      } else {
        console.log('User signed out');
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
      console.log('Sign in successful:', result.user.displayName);
      
      // Redirect to main app after successful login
      this.#router.navigate(['/boxes']);
    } catch (error: any) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }

  public async signOut(): Promise<void> {
    try {
      // Clear encryption keys before signing out
      this.#encryptionService.clearKeyCache();
      
      await signOut(this.#auth);
      console.log('Sign out successful');
      
      // Redirect to login page
      this.#router.navigate(['/login']);
    } catch (error: any) {
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