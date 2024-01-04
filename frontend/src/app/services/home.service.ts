import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Observable, catchError } from 'rxjs';
import { LocalStorageService, localStorageName } from './local-storage.service';
import { DialogService } from './dialog.service';
import { environment } from 'src/environments/environment.template';
import { FilmDetails, getMoviesParams } from '../models/models';
import { observableToBeFn } from 'rxjs/internal/testing/TestScheduler';
import { HttpParams } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class HomeService {
  url: string;
  constructor(
    private http: HttpClient,
    private router: Router,
    private localStorageService: LocalStorageService,
    private dialogService: DialogService,
  ) {
    this.url = environment.backendUrl || 'http://localhost:3000';
  }

  getMovies(params: getMoviesParams | undefined): Observable<any> {
    if (params) {
      let httpParams = new HttpParams();
      for (let key in params) {
        if (params.hasOwnProperty(key) && params[key as keyof getMoviesParams] !== undefined) {
          httpParams = httpParams.set(key, params[key as keyof getMoviesParams]);
        }
      }
      return this.http.get<any>(this.url + '/movie/fetchYTSMovies', { params: httpParams, withCredentials: true });
    }
    return this.http.get<any>(this.url + '/movie/fetchYTSMovies', { withCredentials: true });
  }


  getMovieDetails(imdb_id: string): Observable<any> {
    return this.http.get<any>(this.url + '/movie/fetchMovieDetails/' + imdb_id, { withCredentials: true });
  }
}