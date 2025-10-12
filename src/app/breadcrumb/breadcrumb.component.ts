import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgIconComponent } from '@ng-icons/core';
import { matArrowForwardIos, matHome } from '@ng-icons/material-icons/baseline';

export type BreadcrumbItem = {
  label: string;
  link?: string | Array<string | number>;
  isCurrentPage?: boolean;
};

@Component({
  selector: 'inv-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  imports: [
    CommonModule,
    RouterModule,
    NgIconComponent,
  ],
})
export class BreadcrumbComponent {
  protected readonly ICONS = {
    home: matHome,
    chevronRight: matArrowForwardIos,
  };

  @Input() public items: Array<BreadcrumbItem> = [];
}