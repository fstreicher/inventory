import { Routes } from '@angular/router';
import { BoxListComponent } from './box-list/box-list.component';
import { BoxDetailComponent } from './box-detail/box-detail.component';
import { BoxFormComponent } from './box-form/box-form.component';
import { ItemFormComponent } from './item-form/item-form.component';
import { ItemSearchComponent } from './item-search/item-search.component';

export const routes: Routes = [
  { path: 'boxes', component: BoxListComponent },
  { path: 'search', component: ItemSearchComponent },
  { path: 'box/:id', component: BoxDetailComponent },
  { path: 'add-box', component: BoxFormComponent },
  { path: 'edit-box/:id', component: BoxFormComponent },
  { path: 'box/:id/add-item', component: ItemFormComponent },
  { path: 'box/:id/edit-item/:itemId', component: ItemFormComponent },
  { path: '', redirectTo: '/boxes', pathMatch: 'full' },
];
