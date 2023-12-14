import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DialogService } from '../../services/dialog.service';
import { languages } from '../../models/models';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss', '../../app.component.scss'],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  languages = languages;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private dialogService: DialogService
  ) { }

  ngOnInit(): void {
    if (this.authService.checkLog()) {
      this.router.navigate(['']);
    }
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      firstName: ['', [Validators.required, Validators.pattern("^[A-Z][a-zA-Z]*$")]],
      lastName: ['', [Validators.required, Validators.pattern("^[A-Z][a-zA-Z]*$")]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      repeat_password: ['', [Validators.required, Validators.minLength(8)]],
      language: ['en', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const { username, firstName, lastName, email, password, repeat_password, language } = this.registerForm.value;
      if (password !== repeat_password) {
        const data = {
          title: 'Error',
          text: 'Passwords do not match.',
          text_yes_button: 'Ok',
          yes_callback: () => { },
          reload: false,
        };
        this.dialogService.openDialog(data);
        return;
      }
      this.authService.register(username, firstName, lastName, email, password, language);
    }
  }
}
