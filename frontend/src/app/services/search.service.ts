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

  getAllUsernames(): Observable<GetSearchResultResponseData> {
    return this.http.get<any>(this.url + '/user/allUsernames', { withCredentials: true });
  }

}