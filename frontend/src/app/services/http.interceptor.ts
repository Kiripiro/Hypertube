import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
  ) { }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          if (error.error.error == "Missing refreshToken" || error.error.error == "refreshToken expired") {
            this.authService._frontLogOut('An authentication error has occured, please log in again.');
            return throwError(() => error.error);
          } else if (error.error.error == "Missing accessToken" || error.error.error == "Token expired") {
            return this.authService.refreshToken().pipe(
              switchMap(() => {
                return next.handle(request);
              }),
              catchError((refreshError: any) => {
                return throwError(() => refreshError);
              })
            );
          } else {
            return throwError(() => error.error);
          }
        } else if (error instanceof HttpErrorResponse && error.status === 403) {
          this.authService._frontLogOut('An authentication error has occured, please log in again' + (error.error.error ? (' (' + error.error.error + ')') : '') + '.');
          return throwError(() => error.error);
        }
        return throwError(() => error.error);
      })
    );
  }
}