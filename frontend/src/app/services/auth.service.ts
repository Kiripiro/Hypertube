import { HttpClient, HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import { LocalStorageService, localStorageName } from './local-storage.service';
import { DialogService } from './dialog.service';
import { GetUserResponseData, LoginResponseData, RegisterResponseData, CompleteRegisterResponseData, IpApiResponseData, LocationIQApiResponseData, UpdateLocationResponseData, EmailValidationResponseData, PasswordResetRequestResponseData, PasswordResetValidationResponseData } from '../models/models';
import { environment } from '../../environments/environment.template';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  checkCompleteRegister() {
    throw new Error('Method not implemented.');
  }
  url: string;
  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private localStorageService: LocalStorageService,
    private dialogService: DialogService,
  ) {
    this.url = environment.backendUrl || 'http://localhost:3000';
  }

  private isLogged = new Subject<boolean>();
  public isLoggedEmitter = this.isLogged.asObservable();
  logEmitChange(usr: boolean) {
    this.isLogged.next(usr);
  }

  getUserInfos(username: string): Observable<GetUserResponseData> {
    return this.http.post<GetUserResponseData>(this.url + '/user/username', { username }, { withCredentials: true });
  }

  getUserInfosById(id: number): Observable<GetUserResponseData> {
    return this.http.post<GetUserResponseData>(this.url + '/user/id', { id }, { withCredentials: true });
  }

  checkLog() {
    if (!this.localStorageService.getItem(localStorageName.username))
      return false;
    return true;
  }

  checkLogAndLogout() {
    if (!this.checkLog()) {
      return;
    }
    this.http.get<GetUserResponseData>(this.url + '/user/id', { withCredentials: true }).subscribe({
      next: (response) => {
        this.localStorageService.setMultipleItems(
          { key: localStorageName.id, value: response.user.id || -1 },
          { key: localStorageName.username, value: response.user.username || "" },
          { key: localStorageName.firstName, value: response.user.firstName || "" },
          { key: localStorageName.lastName, value: response.user.lastName || "" },
          { key: localStorageName.emailChecked, value: response.user.email_checked || false },
          { key: localStorageName.avatar, value: response.user.avatar || "" },
          { key: localStorageName.loginApi, value: response.user.loginApi || "" },
        );
        this.logEmitChange(true);
      },
      error: (error) => {
        console.error('User not log:', error);
        if (error == 'User not found') {
          this._frontLogOut('');
        } else {
          this._frontLogOut('Please try to log in again.');
        }
      }
    });
  }

  register(username: string, firstName: string, lastName: string, email: string, password: string, language: string): any {
    this.http.post<RegisterResponseData>(this.url + '/user/register', { username, firstName, lastName, email, password, language }, { withCredentials: true })
      .subscribe({
        next: (response) => {
          const dialogData = {
            title: 'Check your emails',
            text: "An email has been sent to you, please check your email address",
            text_yes_button: "",
            text_no_button: "Close",
            yes_callback: () => { },
            no_callback: () => { this.router.navigate(['/auth/login']); },
            reload: false
          };
          console.log(response);
          this.dialogService.openDialog(dialogData);
        },
        error: (error) => {
          const dialogData = {
            title: 'Registration failed',
            text: error.error,
            text_yes_button: "",
            text_no_button: "Close",
            yes_callback: () => { },
            no_callback: () => { },
            reload: false
          };
          console.error('Registration failed:', error);
          this.dialogService.openDialog(dialogData);
        }
      });
  }

  login(username: string, password: string) {
    this.http.post<LoginResponseData>(this.url + '/user/login', { username, password }, { withCredentials: true })
      .subscribe({
        next: (response) => {
          this.localStorageService.setMultipleItems(
            { key: localStorageName.id, value: response.user.id || -1 },
            { key: localStorageName.username, value: response.user.username || "" },
            { key: localStorageName.firstName, value: response.user.firstName || "" },
            { key: localStorageName.lastName, value: response.user.lastName || "" },
            { key: localStorageName.emailChecked, value: response.user.email_checked || false },
            { key: localStorageName.avatar, value: response.user.avatar || "" },
            { key: localStorageName.loginApi, value: response.user.loginApi || "" },
            { key: localStorageName.language, value: response.user.language || "" },
          );
          this.router.navigate(['']);
          location.reload();
          this.logEmitChange(true);
        },
        error: (error) => {
          const dialogData = {
            title: 'Login failed',
            text: error.message,
            text_yes_button: "",
            text_no_button: "Close",
            yes_callback: () => { },
            no_callback: () => { },
            reload: false
          };
          this.dialogService.openDialog(dialogData);
        }
      });
  }

  login42(code: string) {
    this.http.post<LoginResponseData>(this.url + '/user/login42', { code }, { withCredentials: true }).subscribe({
      next: (response) => {
        console.log(response);
        this.localStorageService.setMultipleItems(
          { key: localStorageName.id, value: response.user.id || -1 },
          { key: localStorageName.username, value: response.user.username || "" },
          { key: localStorageName.firstName, value: response.user.firstName || "" },
          { key: localStorageName.lastName, value: response.user.lastName || "" },
          { key: localStorageName.emailChecked, value: true },
          { key: localStorageName.avatar, value: response.user.avatar || "" },
          { key: localStorageName.loginApi, value: response.user.loginApi },
        );
        this.router.navigate(['']);
        location.reload();
        this.logEmitChange(true);
      },
      error: (error) => {
        console.log(error);
        const dialogData = {
          title: 'Login failed',
          text: error.message,
          text_yes_button: "",
          text_no_button: "Close",
          yes_callback: () => { },
          no_callback: () => { },
          reload: false
        };
        this.dialogService.openDialog(dialogData);
      }
    });
  }
  logout() {
    this.http.post(this.url + '/user/logout', {}, { withCredentials: true })
      .subscribe({
        next: (response) => {
        },
        error: (error) => {
          console.error('Registration failed:', error);
        },
        complete: () => {
          this._frontLogOut('');
        }
      });
  }

  emailValidation(token: string): Observable<EmailValidationResponseData> {
    return this.http.post<EmailValidationResponseData>(this.url + '/user/emailvalidation', { token }, { withCredentials: true });
  }

  sendPasswordResetRequest(email: string): Observable<PasswordResetRequestResponseData> {
    return this.http.post<PasswordResetRequestResponseData>(this.url + '/user/resetPassword', { email }, { withCredentials: true });
  }

  passwordResetValidation(token: string, password: string): Observable<PasswordResetValidationResponseData> {
    return this.http.post<PasswordResetValidationResponseData>(this.url + '/user/resetPasswordValidate', { passwordResetToken: token, password }, { withCredentials: true });
  }

  _frontLogOut(error: string) {
    this.logEmitChange(false);
    this.localStorageService.removeAllUserItem();
    this.router.navigate(['auth/login']);
    if (error.length > 0) {
      const dialogData = {
        title: 'Server error',
        text: error,
        text_yes_button: "",
        text_no_button: "Close",
        yes_callback: () => { },
        no_callback: () => { },
        reload: false
      };
      this.dialogService.openDialog(dialogData);
    }
  }

  refreshToken(): Observable<any> {
    return this.http.post(this.url + '/user/refreshToken', {}, { withCredentials: true });
  }

  getLocationWithIp() {
    this.http.get<IpApiResponseData>('http://ip-api.com/json/?fields=status,message,lat,lon').subscribe(data => {
      console.log("ip-api", data);
    });
  }

  getIpInfos() {
    this.http.get<any>('https://api.ipify.org?format=json').subscribe(data => {
      console.log("ipify", data);
    });
  }
}