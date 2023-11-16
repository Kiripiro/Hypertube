import { Component, OnInit } from '@angular/core';
import { LocalStorageService, localStorageName } from '../services/local-storage.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { HomeService } from 'src/app/services/home.service';
import { HomeUserData, UserSimplified, filterSelectType, sortSelectType } from 'src/app/models/models';
import { DialogService } from 'src/app/services/dialog.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss', '../app.component.scss']
})
export class HomeComponent implements OnInit {

  username = "";
  interestingUsers: UserSimplified[] = [];
  userDisplayed!: HomeUserData;
  img: string[] = [];
  userIndex = 0;

  sortSelected = "";
  sortType: String[] = [
    sortSelectType.Age,
    sortSelectType.Location,
    sortSelectType.Tags,
    sortSelectType.FameRating
  ];

  filterSelected = "";
  filterType: String[] = [
    filterSelectType.Age,
    filterSelectType.Location,
    filterSelectType.Tags,
    sortSelectType.FameRating
  ];

  loading = true;
  error = false;
  notConnected = true;

  personalFameRating = 0;

  constructor(
    private localStorageService: LocalStorageService,
    private authService: AuthService,
    private homeService: HomeService,
    private dialogService: DialogService,
    private router: Router,
  ) {
    if (!this.authService.checkLog()) {
      this.notConnected = true;
      return;
    }
  }

  ngOnInit(): void {

  }
}
