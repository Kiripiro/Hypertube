import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogService } from 'src/app/services/dialog.service';

@Component({
  selector: 'app-profile',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.scss', '../app.component.scss']
})
export class ResetComponent implements OnInit {

  resetForm!: FormGroup;

  sent = false;
  title = "Reset password request";
  textButton = "Send";

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogService: DialogService,
    private router: Router
  ) {

  }

  ngOnInit(): void {
    if (this.authService.checkLog()) {
      this.router.navigate(['']);
    }
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.resetForm.valid) {
      const { email } = this.resetForm.value;
      this.authService.sendPasswordResetRequest(email).subscribe({
        next: (response) => {
          this.sent = true;
          const dialogData = {
            title: 'Success',
            text: response.message,
            text_yes_button: "",
            text_no_button: "Close",
            yes_callback: () => { },
            no_callback: () => { },
            reload: false
          };
          this.dialogService.openDialog(dialogData);
        },
        error: (error) => {
          if (error && error.message && error.message == "User not found") {
            const dialogData = {
              title: 'Error',
              text: "User not found",
              text_yes_button: "",
              text_no_button: "Close",
              yes_callback: () => { },
              no_callback: () => { },
              reload: false
            };
            this.dialogService.openDialog(dialogData);
          } else if (error && error.message && error.message == "You cannot reset the password of a 42 or Google account") {
            const dialogData = {
              title: 'Error',
              text: "You cannot reset the password of a 42 or Google account",
              text_yes_button: "",
              text_no_button: "Close",
              yes_callback: () => { },
              no_callback: () => { },
              reload: false
            };
            this.dialogService.openDialog(dialogData);
          } else if (error && error.message && error.message == "Email not verified") {
            const dialogData = {
              title: 'Error',
              text: "Email not verified",
              text_yes_button: "",
              text_no_button: "Close",
              yes_callback: () => { },
              no_callback: () => { },
              reload: false
            };
            this.dialogService.openDialog(dialogData);
          } else {
            const dialogData = {
              title: 'Error',
              text: "",
              text_yes_button: "",
              text_no_button: "Close",
              yes_callback: () => { },
              no_callback: () => { },
              reload: false
            };
            this.dialogService.openDialog(dialogData);
          }
        }
      });
    }
  }
}
