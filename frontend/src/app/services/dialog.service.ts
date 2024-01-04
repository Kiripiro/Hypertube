import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogComponent } from '../utils/dialog/dialog.component'

@Injectable()
export class DialogService {
  private dialogRef: MatDialogRef<any> | null = null;
  constructor(private dialog: MatDialog) { }

  openDialog(data: any): void {
    if (this.dialogRef) {
      return;
    }
    this.dialogRef = this.dialog.open(DialogComponent, {
      data: data
    });
    this.dialogRef.afterClosed().subscribe(() => {
      this.dialogRef = null;
    });
  }
}