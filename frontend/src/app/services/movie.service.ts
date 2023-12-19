import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.template';
import { DownloadSubtitlesResponse, LoadingMovieResponse, MovieDetailsResponse, MovieFileSizeResponse, StopLoadingMovieResponse, TorrentInfosResponse } from '../models/models';


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

  getLoadingMovie(movieId: Number, freeId: String): Observable<LoadingMovieResponse> {
    return this.http.get<LoadingMovieResponse>(this.url + '/movies/movieLoading/' + movieId + '/' + freeId, { withCredentials: true });
  }

  stopLoadingMovie(movieId: Number, freeId: String): Observable<StopLoadingMovieResponse> {
    return this.http.get<StopLoadingMovieResponse>(this.url + '/movies/stopMovieLoading/' + movieId + '/' + freeId, { withCredentials: true });
  }

  getMovieFileSize(movieId: Number, freeId: String): Observable<MovieFileSizeResponse> {
    return this.http.get<MovieFileSizeResponse>(this.url + '/movies/fileSize/' + movieId + '/' + freeId, { withCredentials: true });
  }

  getTorrentInfos(movieId: Number): Observable<TorrentInfosResponse> {
    return this.http.get<TorrentInfosResponse>(this.url + '/movies/torrentInfos/' + movieId, { withCredentials: true });
  }

  getStream(movieId: Number, freeId: String): Observable<any> {
    return this.http.get<any>(this.url + '/movies/movieStream/' + movieId + '/' + freeId, { withCredentials: true });
  }

  addMovieHistory(imdbId: String, title: String): Observable<any> {
    console.log("addMovieHistory", imdbId,);
    return this.http.post<any>(this.url + '/movies/addMovieHistory/', { imdbId, title }, { withCredentials: true });
  }
  
  getMovieDetails(imdbId: Number): Observable<MovieDetailsResponse> {
    return this.http.get<MovieDetailsResponse>(this.url + '/movies/fetchMovieDetails/' + imdbId, { withCredentials: true });
  }

  downloadSubtitles(imdbId: string, lang: string[]): Observable<DownloadSubtitlesResponse> {
    const langToSend = lang.join('-');
    return this.http.get<DownloadSubtitlesResponse>(this.url + '/movies/downloadSubtitles/' + imdbId + '/' + langToSend, { withCredentials: true });
  }

  getMovieHistory(): Observable<any> {
    return this.http.get<any>(this.url + '/movies/getMovieHistory/', { withCredentials: true });
  }
  getSubtitles(fileName: string) : Observable<any> {
    return this.http.get(this.url + '/subtitles/' + fileName, { responseType: 'text', withCredentials: true });
  }

  getMovieHistoryById(id: Number): Observable<any> {
    return this.http.get<any>(this.url + '/movies/getMovieHistoryById/' + id, { withCredentials: true });
  }
  
  getMovieTest() : Observable<any> { // FOR TEST, TO DELETE
    return this.http.get<MovieDetailsResponse>(this.url + '/movies/testMovies', { withCredentials: true });
  }
}