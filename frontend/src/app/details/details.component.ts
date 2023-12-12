import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MoviesService } from '../services/movie.service';
import { ThemePalette } from '@angular/material/core';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss', '../app.component.scss']
})
export class DetailsComponent implements OnInit {

  ytsId = 0;
  imdbId = 0;
  imdbData: any;

  posterUrl = "";

  success = false;
  error = false;
  loading = true;


  constructor(
    private route: ActivatedRoute,
    private moviesService: MoviesService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.ytsId = params['ytsId'];
      this.imdbId = params['imdbId'];
      this.moviesService.getMovieDetails(this.imdbId).subscribe({
        next: (response) => {
          console.log(response);
          this.imdbData = response.movie;
          this.posterUrl = this.imdbData.poster;
          this.loading = false;
          this.success = true;
        },
        error: (error) => {
          console.log(error);
          console.log("error");
          this.error = true;
        }
      });
    })
  }
}

