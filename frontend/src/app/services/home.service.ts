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
  ombdUrl: string;
  constructor(
    private http: HttpClient,
    private router: Router,
    private localStorageService: LocalStorageService,
    private dialogService: DialogService,
  ) {
    this.url = environment.backendUrl || 'http://localhost:3000';
    this.ombdUrl = 'http://www.omdbapi.com/?apikey=' + environment.ombd_api_key;
  }

  getDownloadedFilmsDetails(): Observable<any> {
    return this.http.get<any>(this.url + '/films');
  }

  getFilmsDetails(filmList: any): Observable<FilmDetails[]> {
    let filmsDetails: Observable<any>[] = [];
    for (let film of filmList) {
      filmsDetails.push(this.http.get<any>(this.ombdUrl + '&t=' + film));
    }
    return new Observable<FilmDetails[]>((observer) => {
      let films: FilmDetails[] = [];
      for (let film of filmsDetails) {
        film.subscribe({
          next: (response) => {
            console.log(response);
            films.push({
              id: null,
              title: response.Title,
              director: response.Director,
              release_date: response.Year,
              writer: response.Writer,
              actors: response.Actors,
              genre: response.Genre,
              language: response.Language,
              plot: response.Plot,
              awards: response.Awards,
              poster_path: response.Poster,
              imdb_id: response.imdbID,
              imdb_rating: response.imdbRating,
            });
            if (films.length === filmsDetails.length) {
              films.sort((a, b) => {
                if (a.title === b.title) {
                  return parseInt(b.release_date) - parseInt(a.release_date);
                }
                return b.title.localeCompare(a.title);
              });
              observer.next(films);
            }
          },
          error: (error) => {
            console.log(error);
            const dialogData = {
              title: 'Error',
              content: error.error.message,
              confirmText: 'Ok',
            };
            this.dialogService.openDialog(dialogData);
          }
        });
      }
    });
  }


  getMovies(params: getMoviesParams | undefined): Observable<any> {
    if (params) {
      let httpParams = new HttpParams();
      for (let key in params) {
        if (params.hasOwnProperty(key) && params[key as keyof getMoviesParams] !== undefined) {
          httpParams = httpParams.set(key, params[key as keyof getMoviesParams]);
        }
      }
      return this.http.get<any>(this.url + '/movies/fetchYTSMovies', { params: httpParams, withCredentials: true });
    }
    return this.http.get<any>(this.url + '/movies/fetchYTSMovies', { withCredentials: true });
  }


  getMovieDetails(imdb_id: string): Observable<any> {
    return this.http.get<any>(this.url + '/movies/fetchMovieDetails/' + imdb_id, { withCredentials: true });
  }

}