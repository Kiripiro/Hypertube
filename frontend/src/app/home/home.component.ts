import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { HomeService } from 'src/app/services/home.service';
import { FilmDetails } from 'src/app/models/models';
import { MatDialog } from '@angular/material/dialog';
import { MovieModalComponent } from '../utils/movie-modal/movie-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss', '../app.component.scss']
})
export class HomeComponent implements OnInit {
  notConnected = false;
  loading = true;
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
    sort_by: 'download_count',
    order_by: 'desc',
    quality: 'all',
    minimum_rating: 0,
  };
  isModalOpen = false;

  search: string = '';
  sortBy: string = '';
  quality: string = '';
  minimum_rating: number = 0;

  private searchTerms$ = new Subject<string>();

  constructor(
    private authService: AuthService,
    private homeService: HomeService,
    public dialog: MatDialog
  ) {
    if (!this.authService.checkLog()) {
      this.notConnected = true;
    }
  }

  ngOnInit(): void {
    if (this.authService.checkLog()) {
      this.loadMovies();

      this.searchTerms$
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((searchTerm: string) => {
            this.params = {
              ...this.params,
              query_term: searchTerm,
              page: 1,
            };
            return this.homeService.getMovies(this.params);
          })
        )
        .subscribe({
          next: (response) => {
            this.films = response.movies;
            this.hasMore = response.hasMore;
          },
          error: (error) => {
            console.log(error);
          },
        });
    }
  }

  resetParams() {
    this.params = {
      limit: 20,
      page: 1,
      query_term: '0',
      genre: 'all',
      sort_by: 'download_count',
      order_by: 'desc',
      quality: 'all',
      minimum_rating: 0,
    };
    this.search = '';
    this.sortBy = '';
    this.quality = '';
    this.minimum_rating = 0;
    this.loadMovies();
  }

  loadMovies() {
    this.loading = true;
    this.homeService.getMovies(this.params).subscribe({
      next: (response) => {
        this.films = response.movies;
        this.hasMore = response.hasMore;
        this.loading = false;
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
          let newMovies = response.movies.filter((movie: any) => !this.films.find((film: any) => film.imdb_id === movie.imdb_id));
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
    this.searchTerms$.next(this.search);
  }

  sortFilms() {
    this.params = {
      ...this.params,
      sort_by: this.sortBy,
      quality: this.quality,
      minimum_rating: this.minimum_rating,
    };
    this.loadMovies();
  }

  openFilmModal(film: any): void {
    if (this.isModalOpen) return;
    this.isModalOpen = true;
    const data = {
      id: film.id,
      title: film.title,
      director: film.director,
      release_date: film.release_date,
      writer: film.writer,
      actors: film.actors,
      genre: film.genre,
      language: film.language,
      plot: film.plot,
      awards: film.awards,
      poster_path: this.films.find((f: any) => f.imdb_id === film.imdb_id)?.poster_path || null,
      imdb_id: film.imdb_id,
      imdb_rating: film.imdb_rating,
      yts_id: film.yts_id,
      free_movie_id: film.free_movie_id
    };
    this.dialog.open(MovieModalComponent, {
      data: {
        ...data,
      },
    });
    this.isModalOpen = false;
  }
}
