import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { HomeService } from 'src/app/services/home.service';
import { FilmDetails } from 'src/app/models/models';
import { MatDialog } from '@angular/material/dialog';
import { MovieModalComponent } from '../utils/movie-modal/movie-modal.component';
import { CommentsService } from '../services/comments.service';

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

  private searchTerms$ = new Subject<string>();

  constructor(
    private authService: AuthService,
    private homeService: HomeService,
    private commentsService: CommentsService,
    public dialog: MatDialog
  ) {
    if (!this.authService.checkLog()) {
      this.notConnected = true;
      return;
    }
  }

  ngOnInit(): void {
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
    this.searchTerms$.next(this.search);
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
    this.homeService.getMovieDetails(film.imdb_id).subscribe({
      next: (response: any) => {
        const movie = response.movie;
        const data = {
          id: film.id,
          title: film.title,
          director: film.director || movie.director,
          release_date: film.release_date || movie.release_date,
          writer: film.writer || movie.writer,
          actors: film.actors || movie.actors,
          genre: film.genre,
          language: film.language || movie.language,
          plot: film.plot || movie.plot,
          awards: film.awards || movie.awards,
          poster_path: this.films.find((f: any) => f.imdb_id === film.imdb_id)?.poster_path || null,
          imdb_id: film.imdb_id,
          imdb_rating: film.imdb_rating,
          yts_id: film.yts_id
        };
        //get the comments for the movie and add them to the data
        this.dialog.open(MovieModalComponent, {
          data: {
            ...data,
          },
        });
      },
      error: (error) => {
        console.log(error);
      }
    });
  }
}
