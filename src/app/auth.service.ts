import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);
  
  // Observable of the current user
  user$: Observable<User | null> = user(this.auth);
  
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

  async signInWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(this.auth, provider);
      console.log('Sign in successful:', result.user.displayName);
      
      // Redirect to main app after successful login
      this.router.navigate(['/boxes']);
    } catch (error: any) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      console.log('Sign out successful');
      
      // Redirect to login page
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }
}