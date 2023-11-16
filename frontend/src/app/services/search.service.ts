import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GetCitiesResponseData, GetInterestingUsersResponseData, GetSearchResultResponseData } from '../models/models';
import { environment } from 'src/environments/environment.template';


@Injectable({
  providedIn: 'root'
})
export class SearchService {
  url: string;
  constructor(
    private http: HttpClient
  ) {
    this.url = environment.backendUrl || 'http://localhost:3000';
  }

  getCities(): Observable<GetCitiesResponseData> {
    return this.http.get<GetCitiesResponseData>(this.url + '/users/cities', { withCredentials: true });
  }

  getSearchResult(age: string, fameRating: string, location: string, tags: string): Observable<GetSearchResultResponseData> {
    return this.http.get<GetSearchResultResponseData>(this.url + '/users/search/' + age + "/" + fameRating + "/" + location + "/" + tags, { withCredentials: true });
  }

}