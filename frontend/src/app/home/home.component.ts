import { Component, OnInit } from '@angular/core';
import { LocalStorageService, localStorageName } from '../services/local-storage.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { HomeService } from 'src/app/services/home.service';
import { FilmDetails, UserSimplified, filterSelectType, sortSelectType } from 'src/app/models/models';
import { DialogService } from 'src/app/services/dialog.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss', '../app.component.scss']
})
export class HomeComponent implements OnInit {

  notConnected = false;
  loading = false;
  error = false;
  filmList = [
    "Catch Me If You Can",
    "The Godfather",
    "The Godfather: Part II",
    "The Dark Knight",
    "The Dark Knight Rises",
    "Superman",
    "Captain America: The First Avenger",
    "Captain America: The Winter Soldier",
    "The Lion King",
    "The Jungle Book",
  ]
  films: FilmDetails[] = [];
  displayInfos: boolean = false;

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
    // this.homeService.getFilmsDetails(this.filmList).subscribe({
    //   next: (response) => {
    //     this.films = response;
    //     console.log(this.films);
    //   },
    //   error: (error) => {
    //     console.log(error);
    //   }
    // });
    this.homeService.getMovies().subscribe({
      next: (response) => {
        console.log(response);
        this.films = response.movies;
      },
      error: (error) => {
        console.log(error);
      }
    });
  }
}
