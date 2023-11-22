import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, catchError, concatMap, of, throwError } from 'rxjs';
import { UserSettings } from 'src/app/models/models';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { SettingsService } from 'src/app/services/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss', '../app.component.scss']
})
export class SettingsComponent implements OnInit {
  updateForm!: FormGroup;
  user: UserSettings | undefined;
  userTags: string[] = [];
  allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  files: string[] = [];
  actualImg: string[] = [];
  sexualPreferences: string[] = [];
  newImg: string[] = [];
  id!: number;

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private authService: AuthService,
    private router: Router,
    private localStorageService: LocalStorageService,
    private dialogService: DialogService

  ) {
    if (!this.authService.checkLog()) {
      this.router.navigate(['auth/login']);
      return;
    }
    this.id = this.localStorageService.getItem("id");
  }

  ngOnInit(): void {
    this.updateForm = this.fb.group({
      username: ['', [Validators.pattern("^[a-zA-Z0-9]*$")]],
      firstName: ['', [Validators.pattern("^[A-Z][a-zA-Z- ]*$")]],
      lastName: ['', [Validators.pattern("^[A-Z][a-zA-Z- ]*$")]],
      email: ['', [Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]],
      password: ['', Validators.minLength(8)],
      confirm_password: ['', Validators.minLength(8)],
      gender: '',
      biography: '',
      maleSexualPreference: false,
      femaleSexualPreference: false,
      nonBinarySexualPreference: false,
      otherSexualPreference: false,
      sexual_preferences: [[], (control: AbstractControl<Array<string>>) => {
        if (control.value === null) {
          return { empty: true };
        }
        return null;
      }],
      tags: false,
      fileStatus: false,
      latitude: null,
      longitude: null,
      city: ''
    });
    this.getUser();
  }

  getUser() {
    this.authService.getUserInfosById(this.id).subscribe((userJson: any) => {
      this.user = userJson.user;
      if (this.user) {
        console.log(this.user);
        const sexualPreferences = this.user.sexual_preferences || [];
        const maleSexualPreference = sexualPreferences.includes('Male');
        const femaleSexualPreference = sexualPreferences.includes('Female');
        const nonBinarySexualPreference = sexualPreferences.includes('Non-binary');
        const otherSexualPreference = sexualPreferences.includes('Other');

        this.updateForm.patchValue({
          gender: this.user.gender,
          maleSexualPreference,
          femaleSexualPreference,
          nonBinarySexualPreference,
          otherSexualPreference,
        });
        if (this.user.picture_1) {
          this.actualImg.push("data:image/jpeg;base64," + this.user.picture_1);
        }
        if (this.user.picture_2) {
          this.actualImg.push("data:image/jpeg;base64," + this.user.picture_2);
        }
        if (this.user.picture_3) {
          this.actualImg.push("data:image/jpeg;base64," + this.user.picture_3);
        }
        if (this.user.picture_4) {
          this.actualImg.push("data:image/jpeg;base64," + this.user.picture_4);
        }
        if (this.user.picture_5) {
          this.actualImg.push("data:image/jpeg;base64," + this.user.picture_5);
        }
        this.user.latitude = this.user.latitude;
        this.user.longitude = this.user.longitude;
      }
    });
  }

  deleteAccount() {
    this.dialogService.openDialog({
      title: 'Delete account',
      text: 'Are you sure you want to delete your account ?',
      text_yes_button: "Yes",
      text_no_button: "No",
      yes_callback: () => {
        this.settingsService.deleteUser().subscribe({
          next: (response) => {
            if (response.message === "User deleted") {
              this.router.navigate(['auth/login']);
            }
          },
          error: (error) => {
            console.error('post deleteUser failed:', error);
          }
        });
      },
      no_callback: () => { },
      reload: false
    });

  }

  async onChangeFileInput(event: any) {
    const files = event.target.files;
    this.newImg = [];
    this.files = [];
    let validMimeTypes = true;

    if (files.length > 5) {
      const data = {
        title: 'Error',
        text: 'You can only upload a maximum of 5 pictures.',
        text_yes_button: 'Ok',
        yes_callback: () => { },
        reload: false,
      };
      this.dialogService.openDialog(data);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mimeType = await this._getMimeTypes(file);
      if (this.allowedTypes.indexOf(mimeType) === -1) {
        validMimeTypes = false;
        break;
      }
    }

    if (!validMimeTypes) {
      const data = {
        title: 'Error',
        text: 'Only PNG and JPEG files are allowed.',
        text_yes_button: 'Ok',
        yes_callback: () => { },
        reload: false,
      };
      this.dialogService.openDialog(data);
      if (event.target instanceof HTMLInputElement) {
        const inputElement = event.target;
        inputElement.value = '';
      }
      this.updateForm.get('fileStatus')?.setValue(false);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.src = window.URL.createObjectURL(file);
        img.onload = () => {
          const res = (reader.result || '') as string;
          this.files.push(res);
          this.newImg.push(res);

          if (this.files.length === files.length) {
            this.updateForm.get('fileStatus')?.setValue(true);
          }
        }
        img.onerror = () => {
          alert('Invalid image file');
          event.target.value = '';
        };
      };
      reader.readAsDataURL(file);
    }
    this.updateForm.get('fileStatus')?.setValue(true);
  }

  _getMimeTypes(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      let mimeType = '';
      reader.onload = (event) => {
        const result = (event.target?.result as ArrayBuffer) || null;
        if (result) {
          const view = new Uint8Array(result);
          mimeType = this._checkMimeType(view);
          resolve(mimeType);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  _checkMimeType(file: Uint8Array) {
    const bytes = [];
    for (let i = 0; i < file.length; i++) {
      bytes.push(file[i].toString(16));
    }
    const hexString = bytes.join('').toUpperCase().slice(0, 8);
    const mimeTypes: Record<string, string> = {
      '89504E47': 'image/png',
      'FFD8FFDB': 'image/jpeg',
      'FFD8FFE0': 'image/jpeg',
      'FFD8FFE1': 'image/jpeg',
      'FFD8FFE2': 'image/jpeg',
      'FFD8FFE3': 'image/jpeg',
      'FFD8FFE8': 'image/jpeg',
    };
    return mimeTypes[hexString];
  }

  onSubmit(): void {
    const formValues = this.updateForm.value;
    const fieldsToCheck = [
      "username",
      "lastName",
      "firstName",
      "email",
      "password",
      "confirm_password",
    ];

    const updatedFields: Partial<UserSettings> = {};

    fieldsToCheck.forEach((field) => {
      if (formValues[field] !== this.user?.[field as keyof UserSettings] && formValues[field] !== "" && formValues[field] !== null) {
        updatedFields[field as keyof UserSettings] = formValues[field];
      }
    });
  }
}
