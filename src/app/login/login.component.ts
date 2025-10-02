import { Component, inject } from '@angular/core';
import { NgIconComponent } from '@ng-icons/core';
import { matError, matSync } from '@ng-icons/material-icons/baseline';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'inv-login',
  templateUrl: './login.component.html',
  imports: [NgIconComponent],
})
export class LoginComponent {
  readonly #authService = inject(AuthService);

  protected readonly ICONS = {
    error: matError,
    sync: matSync,
  };

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