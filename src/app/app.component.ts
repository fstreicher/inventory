import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';

@Component({
  selector: 'inv-root',
  templateUrl: './app.component.html',
  imports: [
    RouterOutlet,
    NavigationComponent
  ],
})
export class AppComponent {
  // App component is now simplified - navigation logic moved to NavigationComponent
}
