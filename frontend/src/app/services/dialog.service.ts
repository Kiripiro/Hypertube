import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../utils/dialog/dialog.component'

@Injectable()
export class DialogService {
  constructor(private dialog: MatDialog) { }

  openDialog(data: any): void {
    this.dialog.open(DialogComponent, {
      data: data
    });
  }
}