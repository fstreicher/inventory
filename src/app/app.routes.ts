import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { BoxDetailComponent } from './box-detail/box-detail.component';
import { BoxFormComponent } from './box-form/box-form.component';
import { BoxListComponent } from './box-list/box-list.component';
import { ItemFormComponent } from './item-form/item-form.component';
import { ItemSearchComponent } from './item-search/item-search.component';
import { LoginComponent } from './login/login.component';
import { QrScannerComponent } from './qr-scanner/qr-scanner.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'scan', component: QrScannerComponent, canActivate: [authGuard] },
  { path: 'boxes', component: BoxListComponent, canActivate: [authGuard] },
  { path: 'search', component: ItemSearchComponent, canActivate: [authGuard] },
  { path: 'box/:id', component: BoxDetailComponent, canActivate: [authGuard] },
  { path: 'add-box', component: BoxFormComponent, canActivate: [authGuard] },
  { path: 'edit-box/:id', component: BoxFormComponent, canActivate: [authGuard] },
  { path: 'box/:id/add-item', component: ItemFormComponent, canActivate: [authGuard] },
  { path: 'box/:id/edit-item/:itemId', component: ItemFormComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/boxes', pathMatch: 'full' },
];
