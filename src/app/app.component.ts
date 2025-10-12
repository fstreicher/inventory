import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';
import { NgxSonnerToaster } from 'ngx-sonner';

@Component({
  selector: 'inv-root',
  templateUrl: './app.component.html',
  imports: [
    RouterOutlet,
    NavigationComponent,
    NgxSonnerToaster,
  ],
})
export class AppComponent {
  // App component is now simplified - navigation logic moved to NavigationComponent
}
