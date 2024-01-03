// import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from "@angular/router";

// export const googleGuard: CanActivateFn = (
//   next: ActivatedRouteSnapshot,
//   state: RouterStateSnapshot) => {
//   const { id, username, firstName, lastName, emailVerified, avatar } = next.queryParams;
//   console.log(next.queryParams);
//   if (!username || !firstName || !lastName || !emailVerified || !avatar || !id) {
//     console.log('error');
//     return false;
//   }
//   console.log(typeof username);
//   console.log(typeof firstName);
//   localStorage.setItem('id', id);
//   localStorage.setItem('username', JSON.stringify(username));
//   localStorage.setItem('firstName', JSON.stringify(firstName));
//   localStorage.setItem('lastName', JSON.stringify(lastName));
//   localStorage.setItem('email_checked', emailVerified);
//   localStorage.setItem('avatar', JSON.stringify(avatar));
//   localStorage.setItem('loginApi', '1');
//   localStorage.setItem('language', 'en');

//   window.location.href = 'http://localhost:4200';
//   return true;
// }

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private scriptElement: HTMLScriptElement | undefined;

  initGoogleSignIn(clientId: string): void {
    this.scriptElement = document.createElement('script');
    this.scriptElement.src = 'https://accounts.google.com/gsi/client';
    this.scriptElement.async = true;
    this.scriptElement.defer = true;

    document.body.appendChild(this.scriptElement);

    this.scriptElement.onload = () => {
      // Logic to initialize Google Sign-In with client ID
      const gIdOnload = document.getElementById('g_id_onload');
      if (gIdOnload) {
        gIdOnload.setAttribute('data-client_id', clientId);
      }
    };
  }

  destroyGoogleSignIn(): void {
    if (this.scriptElement) {
      document.body.removeChild(this.scriptElement);
    }
  }
}
