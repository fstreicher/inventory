import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { ThemeService } from '../theme.service';
import { OfflineService } from '../offline.service';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'inv-navigation',
  standalone: true,
  templateUrl: './navigation.component.html',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
})
export class NavigationComponent {
  private authService = inject(AuthService);
  protected themeService = inject(ThemeService);
  protected offlineService = inject(OfflineService);

  protected isMobileMenuOpen = false;
  protected user$: Observable<User | null> = this.authService.user$;
  protected isOnline$ = this.offlineService.isOnline$;

  protected navItems = [
    { label: 'All boxes', path: '/boxes' },
    { label: 'Search Items', path: '/search' },
    { label: 'Add box', path: '/add-box' },
  ];

  public toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  public closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  public async signOut() {
    try {
      await this.authService.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  public toggleTheme() {
    this.themeService.toggleTheme();
  }

  public getThemeIcon(): string {
    return this.themeService.isDark() ? 'icon-moon' : 'icon-sun';
  }

  public getThemeLabel(): string {
    return this.themeService.theme() === 'dark' ? 'Dark' : 'Light';
  }
}