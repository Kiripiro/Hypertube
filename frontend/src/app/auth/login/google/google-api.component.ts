
import { Component, OnDestroy, OnInit } from '@angular/core';
import { GoogleAuthService } from 'src/app/services/google-api.service';
import { environment } from 'src/environments/environment.template';

@Component({
    selector: 'app-google-button',
    template: `
    <div 
        id="g_id_onload"
        data-client_id="${environment.CLIENT_ID_GOOGLE}"
        data-context="signin"
        data-ux_mode="popup"
        data-itp_support="true"
        data-login_uri="http://localhost:3000/user/loginGoogle"
    ></div>
    <div
      class="g_id_signin"
      data-type="standard"
      data-size="large"
      data-theme="outline"
      data-text="sign_in_with"
      data-shape="rectangular"
      data-logo_alignment="center"
      (click)="handleSignIn()"
    ></div>
  `,
})
export class GoogleButtonComponent implements OnInit, OnDestroy {

    constructor(private googleAuthService: GoogleAuthService) { }

    ngOnInit(): void {
        this.googleAuthService.initGoogleSignIn(environment.CLIENT_ID_GOOGLE);
    }

    ngOnDestroy(): void {
        this.googleAuthService.destroyGoogleSignIn();
    }

    handleSignIn(): void {
        console.log('handleSignIn');

    }
}
