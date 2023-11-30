import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-film-modal',
  templateUrl: './movie-modal.component.html',
  styleUrls: ['./movie-modal.component.scss', '../../app.component.scss'],
})
export class MovieModalComponent {
  constructor(
    public dialogRef: MatDialogRef<MovieModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  close(): void {
    this.dialogRef.close();
  }
}
