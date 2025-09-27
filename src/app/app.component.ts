import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'inv-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  protected isMobileMenuOpen = false;

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
}
