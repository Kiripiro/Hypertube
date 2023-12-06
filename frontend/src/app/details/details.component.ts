import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SafeResourceUrl } from '@angular/platform-browser'
import { environment } from 'src/environments/environment.template';
import { MoviesService } from '../services/movie.service';
import { ThemePalette } from '@angular/material/core';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss', '../app.component.scss']
})
export class DetailsComponent implements OnInit {

  MIN_PERCENTAGE = 5;

  movieId = 0;
  url = "";
  loaded = false;

  color: ThemePalette = 'primary';
  mode: ProgressSpinnerMode = 'determinate';
  progressValue = 0;
  
  videoUrl: SafeResourceUrl | undefined;
  
  constructor(
    private route: ActivatedRoute,
    private movieService: MoviesService,
    private router: Router
  ) {
    this.url = environment.backendUrl || 'http://localhost:3000';
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.movieId = params['movieId'];
      console.log("this.movieId", this.movieId)
      // this.videoUrl = 'http://localhost:3000/movies/movieStream/' + this.movieId;
      this.videoUrl = this.url + '/movies/movieStream/' + this.movieId;
    })
    this.getLoadingMovie();
  }

  getLoadingMovie() {
    console.log("getLoadingMovie movieId = ", this.movieId)
    this.movieService.getLoadingMovie(this.movieId).subscribe({
      next: (response) => {
        console.log("getLoadingMovie", response);
        console.log("this.router.url", this.router.url)
        this.progressValue = (response.data.percentage * 100 / this.MIN_PERCENTAGE)
        if (response.data.percentage < this.MIN_PERCENTAGE && this.router.url == ("/stream/" + this.movieId)) {
          setTimeout(() => {
            this.getLoadingMovie();
          }, 5000);
        } else if (response.data.percentage >= this.MIN_PERCENTAGE) {
          this.loaded = true;
        }
      },
      error: (error) => {
        console.log(error);
      }
    });
  }
}
