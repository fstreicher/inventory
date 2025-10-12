import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent } from '@ng-icons/core';
import { matArrowForwardIos, matPlus, matQrCode } from '@ng-icons/material-icons/baseline';
import { Observable, map, startWith } from 'rxjs';
import { QrExportComponent } from '../qr-export/qr-export.component';
import { Box, FirestoreService } from '../services/firestore.service';
import { OfflineService } from '../services/offline.service';

type BoxListState = {
  loading: boolean;
  boxes: Array<Box>;
}

@Component({
  selector: 'inv-box-list',
  templateUrl: './box-list.component.html',
  imports: [
    CommonModule,
    RouterLink,
    NgIconComponent,
    QrExportComponent,
  ],
})
export class BoxListComponent {
  readonly #firestoreService: FirestoreService = inject(FirestoreService);

  protected offlineService = inject(OfflineService);

  protected readonly ICONS = {
    chevronRight: matArrowForwardIos,
    plus: matPlus,
    qrCode: matQrCode,
  };

  protected boxState$: Observable<BoxListState> = this.#firestoreService.getBoxes().pipe(
    map(boxes => ({ loading: false, boxes })),
    startWith({ loading: true, boxes: [] })
  );

  @ViewChild(QrExportComponent) public qrExportDialog!: QrExportComponent;

  protected openQrExport(): void {
    void this.qrExportDialog.open();
  }
}
