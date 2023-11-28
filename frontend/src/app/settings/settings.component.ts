import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, catchError, concatMap, of, throwError } from 'rxjs';
import { UserSettings } from 'src/app/models/models';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog.service';
import { LocalStorageService, localStorageName } from 'src/app/services/local-storage.service';
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
  file!: string;;
  actualImg!: string;
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
      fileStatus: [false],
    });
    this.getUser();
  }

  getUser() {
    this.authService.getUserInfosById(this.id).subscribe((userJson: any) => {
      this.user = userJson.user;
      console.log(this.user);
      if (this.user) {
        if (this.user.avatar) {
          if (this.user.avatar.includes("http") || this.user.avatar.includes("https"))
            this.actualImg = this.user.avatar;
          else
            this.actualImg = "data:image/png;base64," + this.user.avatar;
        }
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
              this.authService.logEmitChange(false);
              this.localStorageService.removeAllUserItem();
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
    const file = event.target.files[0];
    let validMimeTypes = true;

    if (!file) {
      this.updateForm.get('fileStatus')?.setValue(false);
      return;
    }

    const mimeType = await this._getMimeTypes(file);
    if (this.allowedTypes.indexOf(mimeType) === -1) {
      validMimeTypes = false;
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

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = window.URL.createObjectURL(file);
      img.onload = () => {
        const res = (reader.result || '') as string;
        this.file = res;
        this.updateForm.get('fileStatus')?.setValue(true);
      }
      img.onerror = () => {
        alert('Invalid image file');
        event.target.value = '';
      };
    };
    reader.readAsDataURL(file);
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
    ];

    const updatedFields: Partial<UserSettings> = {};

    let hasChanges = false;

    fieldsToCheck.forEach((field) => {
      if (formValues[field] !== this.user?.[field as keyof UserSettings] && formValues[field] !== "" && formValues[field] !== null) {
        updatedFields[field as keyof UserSettings] = formValues[field];
        hasChanges = true;
      }
    });

    if (!this.user?.loginApi) {
      if (formValues.email !== this.user?.email && formValues.email !== "" && formValues.email !== null) {
        updatedFields.email = formValues.email;
        hasChanges = true;
      }
      if (formValues.password !== "" && formValues.password !== null) {
        updatedFields.password = formValues.password;
        hasChanges = true;
      }
      if (formValues.confirm_password !== "" && formValues.confirm_password !== null) {
        updatedFields.confirm_password = formValues.confirm_password;
        hasChanges = true;
      }
      if (updatedFields.password && updatedFields.confirm_password && updatedFields.password !== updatedFields.confirm_password) {
        const data = {
          title: 'Error',
          text: 'Passwords do not match.',
          text_yes_button: 'Ok',
          yes_callback: () => { },
          reload: false,
        };
        this.dialogService.openDialog(data);
        return;
      } else if ((updatedFields.password && !updatedFields.confirm_password) || (!updatedFields.password && updatedFields.confirm_password)) {
        const data = {
          title: 'Error',
          text: 'Please enter both password and confirm password.',
          text_yes_button: 'Ok',
          yes_callback: () => { },
          reload: false,
        };
        this.dialogService.openDialog(data);
        return;
      } else if (updatedFields.password && updatedFields.confirm_password && updatedFields.password === updatedFields.confirm_password) {
        hasChanges = true;
      }
    }



    if (!hasChanges && !this.file) {
      const dialogData = {
        title: 'Error',
        text: 'Please update at least one field to update your profile.',
        text_yes_button: 'Ok',
        yes_callback: () => { },
        reload: false,
      };
      this.dialogService.openDialog(dialogData);
      return;
    }

    this.settingsService.updateUser(updatedFields, this.file).subscribe({
      next: (response) => {
        console.log(response);
        if (response.message === "User updated") {
          this.localStorageService.setMultipleItems(
            { key: localStorageName.username, value: response.user.username || "" },
            { key: localStorageName.firstName, value: response.user.firstName || "" },
            { key: localStorageName.lastName, value: response.user.lastName || "" },
            { key: localStorageName.emailChecked, value: response.user.email_checked || false },
            { key: localStorageName.avatar, value: response.user.avatar || "" },
            { key: localStorageName.loginApi, value: response.user.loginApi || "" },
          );
          const data = {
            title: 'Success',
            text: 'Your profile has been updated.',
            text_yes_button: 'Ok',
            yes_callback: () => { },
            reload: false,
          };
          this.dialogService.openDialog(data);
          this.file = "";
          this.updateForm.reset();
          this.getUser();
        }
      },
      error: (error) => {
        const dialogData = {
          title: 'Update failed',
          text: error.error,
          text_yes_button: 'Ok',
          yes_callback: () => { },
          reload: false,
        };
        this.dialogService.openDialog(dialogData);
      }
    });
  }
}
