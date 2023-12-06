import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SafeResourceUrl } from '@angular/platform-browser'
import { environment } from 'src/environments/environment.template';
import { MoviesService } from '../services/movie.service';
import { ThemePalette } from '@angular/material/core';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { VgApiService } from '@videogular/ngx-videogular/core';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss', '../app.component.scss']
})
export class DetailsComponent implements OnInit {

  MIN_PERCENTAGE = 5;
  MIN_BYTES = 30000000;

  movieId = 0;
  url = "";
  loaded = false;
  showVolume = false;

  color: ThemePalette = 'primary';
  mode: ProgressSpinnerMode = 'determinate';
  progressValue = 0;
  
  videoUrl: SafeResourceUrl | undefined;

  @ViewChild('media') media: any;

  video: any;
  videoPlayButton: any;
  videoPlayButtonIcon = "play_arrow";
  progressRange: any;
  progressBar: any;

  videoPlaying = false;
  percentage = 0;
  oldCurrentTime = 0;
  seekBool = false;

  maxProgressBar = 1000;

  //volumeSlider
  disabled = false;
  max = 100;
  min = 0;
  showTicks = false;
  step = 1;
  thumbLabel = false;
  value = 0;
  isHidden = true;
  
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
      this.videoUrl = this.url + '/movies/movieStream/' + this.movieId;
    })
    this.getLoadingMovie();
  }

  onVideoLoad() {
    console.log('Video metadata loaded');
    this.video = document.getElementById('videoPlayerOrigin') as HTMLVideoElement;
    this.videoPlayButton = document.getElementById('videoPlayButton') as HTMLButtonElement;
    this.progressRange = document.getElementById('progressRange') as HTMLDivElement;
    this.progressBar = document.getElementById('progressBar') as HTMLDivElement;
    this.value = this.video.volume * 100;
  }

  togglevideo(){
    if(!this.videoPlaying){
      this.video.play();
      this.videoPlaying = true;
      this.videoPlayButtonIcon = "pause";
    }else{
      this.video.pause();
      this.videoPlaying = false;
      this.videoPlayButtonIcon = "play_arrow";
    }
  }

  changeSeekBar(event: MouseEvent) {
    const clickPosition = (event as MouseEvent).clientX - this.progressRange.getBoundingClientRect().left;
    const progressRangeWidth = this.progressRange.getBoundingClientRect().width;
    const percentage = (clickPosition / progressRangeWidth) * 100;
    const videoTimeSelected = (percentage * this.video.duration) / 100;
    console.log("percentage", percentage)
    console.log("videoTimeSelected", videoTimeSelected)
    if (videoTimeSelected < this.maxProgressBar) {
      this.video.currentTime = videoTimeSelected;
    }
  }

  onTimeUpdate(){
    if (!this.seekBool) {
      if (this.video.currentTime > this.maxProgressBar) {
        this.video.currentTime = this.oldCurrentTime;
      }
      else {
        this.oldCurrentTime = this.video.currentTime;
        const value = (this.video.currentTime / this.video.duration) * 100;
        // console.log("value", value)
        this.progressBar.style.width = value + "%";
      }
    }
    // currentTime.textContent = formatTime(video.currentTime);
    // duration.textContent = formatTime(video.duration);
  }

  ngOnDestroy(): void {
    console.log('Le composant est en train d\'être détruit.');
    this.movieService.stopLoadingMovie(this.movieId).subscribe({
      next: (response) => {
        console.log("stopLoadingMovie", response.message);
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  getLoadingMovie() {
    console.log("getLoadingMovie movieId = ", this.movieId)
    this.movieService.getLoadingMovie(this.movieId).subscribe({
      next: (response) => {
        console.log("getLoadingMovie", response);
        console.log("this.router.url", this.router.url)
        this.progressValue = (response.data.size * 100 / this.MIN_BYTES)
        if (response.data.size < this.MIN_BYTES && this.router.url == ("/stream/" + this.movieId)) {
          setTimeout(() => {
            this.getLoadingMovie();
          }, 5000);
        } else if (response.data.size >= this.MIN_BYTES) {
          this.loaded = true;
        }
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  changeVolumeBarDisplaying() {
    console.log("changeVolumeBarDisplaying")
    this.showVolume = !this.showVolume;
    this.isHidden = !this.isHidden;
  }

  onChangeVolume(event: any) {
    console.log("onChangeVolume", event.value)
    console.log("this.video.volume", this.video.volume)
    this.video.volume = this.value / 100;
  }
  
}

