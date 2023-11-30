import { Component, OnInit } from '@angular/core';
import { LocalStorageService, localStorageName } from '../services/local-storage.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { HomeService } from 'src/app/services/home.service';
import { FilmDetails } from 'src/app/models/models';
import { DialogService } from 'src/app/services/dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { MovieModalComponent } from '../utils/movie-modal/movie-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss', '../app.component.scss']
})
export class HomeComponent implements OnInit {

  notConnected = false;
  loading = false;
  error = false;
  films: FilmDetails[] = [];
  hasMore = false;
  displayInfos: boolean = false;
  scrollDistance = 2;
  scrollUpDistance = 1;
  infiniteScrollUp = true;
  params = {
    limit: 20,
    page: 1,
    query_term: '0',
    genre: 'all',
    sort_by: 'year',
    order_by: 'desc',
  };

  search: string = '';
  sortBy: string = 'title';
  order: string = 'asc';

  constructor(
    private authService: AuthService,
    private homeService: HomeService,
    public dialog: MatDialog
  ) {
    if (!this.authService.checkLog()) {
      this.notConnected = true;
      return;
    }
  }

  ngOnInit(): void {
    this.loadMovies();
  }

  loadMovies() {
    this.homeService.getMovies(this.params).subscribe({
      next: (response) => {
        this.films = response.movies;
        this.hasMore = response.hasMore;
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  loadData() {
    if (this.hasMore) {
      this.params = {
        ...this.params,
        page: this.params.page + 1,
      };
      this.homeService.getMovies(this.params).subscribe({
        next: (response) => {
          const newMovies = response.movies.filter((movie: any) => !this.films.find((film: any) => film.imdb_id === movie.imdb_id));
          this.films = this.films.concat(newMovies);
          this.hasMore = response.hasMore;
        },
        error: (error) => {
          console.log(error);
        }
      });
    }
  }

  searchFilms() {
    this.params = {
      ...this.params,
      query_term: this.search,
      page: 1,
    };
    this.loadMovies();
  }

  sortFilms() {
    this.params = {
      ...this.params,
      sort_by: this.sortBy,
      order_by: this.order,
    };
    this.loadMovies();
  }

  openFilmModal(film: any): void {
    const dialogRef = this.dialog.open(MovieModalComponent, {
      data: film,
    });
  }
}
