import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly #platformId = inject(PLATFORM_ID);
  readonly #isBrowser = isPlatformBrowser(this.#platformId);
  
  // Reactive signals for theme state
  public theme = signal<Theme>('light');
  public isDark = signal<boolean>(false);
  
  constructor() {
    if (this.#isBrowser) {
      // Initialize theme from localStorage or browser preference
      const savedTheme = localStorage.getItem('theme') as Theme;
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
      
      this.theme.set(initialTheme);
      
      // Update dark mode state when theme changes
      effect(() => {
        this.#updateDarkMode();
      });
      
      // Set initial dark mode state
      this.#updateDarkMode();
    }
  }
  
  #updateDarkMode(): void {
    if (!this.#isBrowser) return;
    
    const currentTheme = this.theme();
    const isDark = currentTheme === 'dark';
    
    this.isDark.set(isDark);
    
    // Update DOM and localStorage
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('theme', currentTheme);
  }
  
  public setTheme(theme: Theme): void {
    this.theme.set(theme);
  }
  
  public toggleTheme(): void {
    const current = this.theme();
    this.setTheme(current === 'light' ? 'dark' : 'light');
  }
}