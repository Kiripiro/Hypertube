import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { environment } from 'src/environments/environment.template';
import { HttpClient } from '@angular/common/http';
import { LocalStorageService, localStorageName } from './local-storage.service';
import { loginGoogleResponseData } from '../models/models';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

const oAuthConfig = {
  issuer: 'https://accounts.google.com',
  strictDiscoveryDocumentValidation: false,
  redirectUri: 'http://localhost:4200/auth/login',
  clientId: environment.CLIENT_ID_GOOGLE,
  scope: 'openid profile email',
};

export interface GoogleUser {
  name: string;
  given_name: string;
  family_name: string;
  avatar: string;
  email: string;
  email_verified: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleApiService {
  user!: GoogleUser;
  url!: string;

  constructor(
    private readonly oAuthService: OAuthService,
    private http: HttpClient,
    private localStorageService: LocalStorageService,
    private authService: AuthService,
    private router: Router,

  ) {
    this.url = environment.backendUrl || 'http://localhost:3000';
    this.configureOAuth();
  }

  private configureOAuth(): void {
    this.oAuthService.configure(oAuthConfig);
    this.oAuthService.loadDiscoveryDocument();
  }


  loginWithGoogle(): void {
    this.oAuthService.tryLoginImplicitFlow().then(() => {
      if (!this.oAuthService.hasValidAccessToken()) {
        this.oAuthService.initImplicitFlow();
      } else {
        console.log('Google');
        this.oAuthService.loadUserProfile().then((user: any) => {
          console.log(user);
          const infos = JSON.stringify(user.info);
          const { name, given_name, family_name, picture, email, email_verified } = JSON.parse(infos);
          console.log(infos);
          this.user = {
            name,
            given_name,
            family_name,
            avatar: picture,
            email,
            email_verified
          };
          this.http.post<loginGoogleResponseData>(this.url + '/user/loginGoogle', { user: this.user }, { withCredentials: true }).subscribe({
            next: (response) => {
              console.log(response);
              console.log('User log:', response.user);
              if (response.message == "User logged in successfully" && response.user) {
                this.localStorageService.setMultipleItems(
                  { key: localStorageName.id, value: response.user.id || -1 },
                  { key: localStorageName.username, value: response.user.username || "" },
                  { key: localStorageName.firstName, value: response.user.firstName || "" },
                  { key: localStorageName.lastName, value: response.user.lastName || "" },
                  { key: localStorageName.avatar, value: response.user.avatar || false },
                  { key: localStorageName.emailChecked, value: true },
                  { key: localStorageName.loginApi, value: response.user.loginApi }
                );
              }
              this.authService.logEmitChange(true);
              this.router.navigate(['']);
              location.reload();
            },
            error: (error) => {
              console.error('Error fetching Google user:', error);
            }
          });
        }).catch((err) => {
          console.log('Error fetching Google user:', err);
        });
      }
    }
    ).catch((err) => {
      console.log('Google user not logged in');
    });
  }
}
