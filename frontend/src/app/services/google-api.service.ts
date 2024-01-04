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
