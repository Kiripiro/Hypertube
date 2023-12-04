import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-film-modal',
  templateUrl: './movie-modal.component.html',
  styleUrls: ['./movie-modal.component.scss', '../../app.component.scss'],
})
export class MovieModalComponent {

  id = 0;

  constructor(
    public dialogRef: MatDialogRef<MovieModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    console.log("data", data)
    console.log("data.yts_id", data.yts_id)
    this.id = data.yts_id;
  }

  close(): void {
    this.dialogRef.close();
  }
}
