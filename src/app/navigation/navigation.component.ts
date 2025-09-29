import { CommonModule } from '@angular/common';
import { Component, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { User } from '@angular/fire/auth';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { OfflineService } from '../services/offline.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'inv-navigation',
  templateUrl: './navigation.component.html',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
  ],
})
export class NavigationComponent {
  readonly #authService = inject(AuthService);
  protected themeService = inject(ThemeService);
  protected offlineService = inject(OfflineService);

  protected isMobileMenuOpen = false;
  protected user$: Observable<User | null> = this.#authService.user$;
  protected isOnline$ = this.offlineService.isOnline$;

  protected navItems = [
    { label: 'My boxes', path: '/boxes' },
    { label: 'Search Items', path: '/search' },
    { label: 'Add box', path: '/add-box' },
  ];

  protected name: Signal<string | null> = toSignal(
    this.#authService.user$.pipe(
      // Map to display name or email
      map((user: User | null) => {
        return (
          user?.displayName?.split(' ')[0] ||
          user?.email ||
          'User'
        );
      })
    ),
    { initialValue: 'User' }
  );

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  protected async signOut(): Promise<void> {
    try {
      await this.#authService.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  protected getThemeIcon(): string {
    return this.themeService.isDark() ? 'icon-moon' : 'icon-sun';
  }

  protected getThemeLabel(): string {
    return this.themeService.theme() === 'dark' ? 'Dark' : 'Light';
  }
}