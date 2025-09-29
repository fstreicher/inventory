import { Component, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'inv-login',
  templateUrl: './login.component.html',
  imports: [],
})
export class LoginComponent {
  readonly #authService = inject(AuthService);

  public isLoading = false;
  public errorMessage = '';

  public async signInWithGoogle(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.#authService.signInWithGoogle();
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.errorMessage = error.message || 'Failed to sign in. Please try again.';
      } else {
        this.errorMessage = 'Failed to sign in. Please try again.';
      }
    } finally {
      this.isLoading = false;
    }
  }
}