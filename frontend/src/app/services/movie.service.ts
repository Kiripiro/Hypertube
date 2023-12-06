import { HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.template';
import { LoadingMovieResponse, StopLoadingMovieResponse } from '../models/models';


@Injectable({
  providedIn: 'root'
})
export class MoviesService {
  url: string;
  constructor(
    private http: HttpClient
  ) {
    this.url = environment.backendUrl || 'http://localhost:3000';
  }

  getLoadingMovie(movieId: Number):Observable<LoadingMovieResponse> {
    return this.http.get<LoadingMovieResponse>(this.url + '/movies/movieLoading/' + movieId, { withCredentials: true });
  }

  stopLoadingMovie(movieId: Number):Observable<StopLoadingMovieResponse> {
    return this.http.get<StopLoadingMovieResponse>(this.url + '/movies/stopMovieLoading/' + movieId, { withCredentials: true });
  }

//   getMovieById(movieId: Number):Observable<GetMovieByIdResponseData> {
//     return this.http.get<GetMovieByIdResponseData>(this.url + '/movies/' + movieId, { withCredentials: true });
//   }

//   getMovieStream(movieId: Number):Observable<GetMovieByIdResponseData> {
//     return this.http.get<GetMovieByIdResponseData>(this.url + '/movies/stream/' + movieId, { withCredentials: true });
//   }
}