import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SafeResourceUrl } from '@angular/platform-browser'
import { environment } from 'src/environments/environment.template';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss', '../app.component.scss']
})
export class DetailsComponent implements OnInit {

  movieId = 0;
  url = "";
  
  videoUrl: SafeResourceUrl | undefined;
  
  constructor(
    private route: ActivatedRoute
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
  }
}
