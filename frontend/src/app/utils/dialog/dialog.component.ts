import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent {
    title: string = 'title';
    text: string = "text";
    text_yes_button: string = "text_yes_button";
    text_no_button: string = "text_no_button";
    yes_callback: Function;
    no_callback: Function;
    buttonDivJustifyContent = "space-between"
    reload = false;
  
    constructor(
      @Inject(MAT_DIALOG_DATA) public dialogData: any,
      private dialogRef: MatDialogRef<DialogComponent>
    ) {
      this.title = dialogData.title || "";
      this.text = dialogData.text || "";
      this.text_yes_button = dialogData.text_yes_button || "";
      this.text_no_button = dialogData.text_no_button || "";
      this.yes_callback = dialogData.yes_callback as Function;
      this.no_callback = dialogData.no_callback as Function;
      this.reload = dialogData.reload;
      if (this.text_yes_button.length < 0) {
        this.buttonDivJustifyContent = 'end';
      }
    }
  
    yesCallback(): void {
      this.yes_callback();
      this.dialogRef.close();
      if (this.reload) {
        location.reload();
      }
    }

    noCallback(): void {
      this.no_callback();
      this.dialogRef.close();
    }
  }
