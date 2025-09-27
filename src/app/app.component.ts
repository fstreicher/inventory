import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';
import { ThemeService } from './theme.service';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'inv-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private authService = inject(AuthService);
  protected themeService = inject(ThemeService);
  
  protected isMobileMenuOpen = false;
  protected user$: Observable<User | null> = this.authService.user$;

  protected navItems = [
    { label: 'All boxes', path: '/boxes' },
    { label: 'Search Items', path: '/search' },
    { label: 'Add box', path: '/add-box' },
  ]

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
