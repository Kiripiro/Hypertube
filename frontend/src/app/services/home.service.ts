import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { LocalStorageService, localStorageName } from './local-storage.service';
import { DialogService } from './dialog.service';
import { GetFameRatingResponseData, GetInterestingUsersResponseData, GetUserResponseData, UserTags } from '../models/models';
import { environment } from 'src/environments/environment.template';


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
}