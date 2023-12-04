import { HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.template';


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

//   getMovieById(movieId: Number):Observable<GetMovieByIdResponseData> {
//     return this.http.get<GetMovieByIdResponseData>(this.url + '/movies/' + movieId, { withCredentials: true });
//   }

//   getMovieStream(movieId: Number):Observable<GetMovieByIdResponseData> {
//     return this.http.get<GetMovieByIdResponseData>(this.url + '/movies/stream/' + movieId, { withCredentials: true });
//   }
}