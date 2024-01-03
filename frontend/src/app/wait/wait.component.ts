import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../services/local-storage.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogService } from 'src/app/services/dialog.service';

@Component({
  selector: 'app-profile',
  templateUrl: './wait.component.html',
  styleUrls: ['./wait.component.scss', '../app.component.scss']
})
export class WaitComponent implements OnInit {

  text = "Waiting...";

  emailValid = false;

  resetPasswordForm!: FormGroup;

  resetPassword = false;
  token = "";

  constructor(
    private localStorageService: LocalStorageService,
    private authService: AuthService,
    private router: Router,
    private dialogService: DialogService,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
  ) {

  }

  ngOnInit(): void {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      repeat_password: ['', [Validators.required, Validators.minLength(8)]],
    });
    this.activatedRoute.params.subscribe(params => {
      if (params['type'] && (params['type'] == "email" || params['type'] == "resetpassword") && params['token'] && params['token'].length > 0) {
        this.token = params['token'];
        if (params['type'] == "email") {
          this.text = "Wait...";
          this.authService.emailValidation(this.token).subscribe(
            (response) => {
              this.text = "Your email has been verified !";
              this.emailValid = true;
            },
            (error) => {
              this.text = "Error";
              const dialogData = {
                title: 'Email verification error',
                text: error.error,
                text_yes_button: "",
                text_no_button: "Close",
                yes_callback: () => { },
                no_callback: () => { },
                reload: false
              };
              this.dialogService.openDialog(dialogData);
            }
          );
        } else if (params['type'] == "resetpassword") {
          this.text = "Wait...";
          this.resetPassword = true;
        } else {
          this.text = "Error";
        }
      } else {
        this.text = "Error";
      }
    })
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid) {
      const { password, repeat_password } = this.resetPasswordForm.value;
      if (password != repeat_password) {
        const dialogData = {
          title: 'Password reset',
          text: "Password doesn't match",
          text_yes_button: "",
          text_no_button: "Close",
          yes_callback: () => { },
          no_callback: () => { },
          reload: false
        };
        this.dialogService.openDialog(dialogData);
        return;
      }
      this.authService.passwordResetValidation(this.token, password).subscribe(
        (response) => {
          this.text = "Your password has been reset !";
          this.emailValid = true;
          this.resetPassword = false;
        },
        (error) => {
          console.error('emailValidation failed:', error);
          this.text = "Error";
          const dialogData = {
            title: 'Password reset',
            text: error.error,
            text_yes_button: "",
            text_no_button: "Close",
            yes_callback: () => { },
            no_callback: () => { },
            reload: false
          };
          this.dialogService.openDialog(dialogData);
        }
      );
    }
  }
}
