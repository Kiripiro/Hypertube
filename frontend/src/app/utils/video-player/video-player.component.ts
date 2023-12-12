import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SafeResourceUrl } from '@angular/platform-browser'
import { environment } from 'src/environments/environment.template';
import { ThemePalette } from '@angular/material/core';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { VgApiService } from '@videogular/ngx-videogular/core';
import { MoviesService } from 'src/app/services/movie.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss', '../../app.component.scss']
})
export class VideoPlayerComponent implements OnInit, AfterViewInit {
  @Input()
  ytsId!: number;
  @Input()
  imdbId!: string;

  MIN_BYTES = 30000000;
  SECU_BYTES = 5000000;
  SECU_TIME = 0;

  movieId = 0;
  loaded = false;
  videoLoaded = false;
  progressValue = 0;
  totalSize = 0;
  downloadedValue = 0;

  imdb_id = "";

  url = "";
  videoUrl: SafeResourceUrl | undefined;

  @ViewChild('media') media: any;

  video: any;
  videoPlayButton: any;
  videoPlayButtonIcon = "play_arrow";
  progressRange: any;
  progressBar: any;
  loadingBar: any;

  videoPlaying = false;
  oldCurrentTime = 0;

  maxProgressBar = 1000;

  //volumeSlider
  showVolume = false;
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
    private router: Router,
    private http: HttpClient
  ) {
    this.url = environment.backendUrl || 'http://localhost:3000';
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      console.log("params", params);
      this.movieId = params['movieId'];
      this.imdbId = params['imdbId'];

      console.log("this.movieId", this.movieId)
      console.log("this.imdbId", this.imdbId)
    });
    this.getLoadingMovie();
    this.getMovieFileSize();
    // this.getStreamingVideo();
    this.videoUrl = this.url + '/movies/movieStream/' + this.movieId;
  }

  getStreamingVideo() {
    const streamUrl = this.url + '/movies/movieStream/' + this.movieId;
    console.log("getStreamingVideo")
    this.movieService.getStream(this.movieId).subscribe({
      next: (response) => {
        console.log("getStream", response)
        const videoBlob = new Blob([response], { type: 'video/mp4' });
        const videoUrl = URL.createObjectURL(videoBlob);
        this.videoUrl = videoUrl;
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  ngAfterViewInit() {

  }

  onVideoLoad() {
    console.log('Video metadata loaded');
    this.video = document.getElementById('videoPlayerOrigin') as HTMLVideoElement;
    this.videoPlayButton = document.getElementById('videoPlayButton') as HTMLButtonElement;
    this.progressRange = document.getElementById('progressRange') as HTMLDivElement;
    this.progressBar = document.getElementById('progressBar') as HTMLDivElement;
    this.loadingBar = document.getElementById('loadingBar') as HTMLDivElement;
    this.value = this.video.volume * 100;
    if (this.downloadedValue > 0 && this.downloadedValue < 100) {
      this.loadingBar.style.width = this.downloadedValue + "%";
    }
    this.videoLoaded = true;
  }

  togglevideo() {
    if (!this.videoLoaded)
      return;
    if (!this.videoPlaying) {
      this.video.play();
      this.videoPlaying = true;
      this.videoPlayButtonIcon = "pause";
    } else {
      this.video.pause();
      this.videoPlaying = false;
      this.videoPlayButtonIcon = "play_arrow";
    }
  }

  changeSeekBar(event: MouseEvent) {
    if (!this.videoLoaded)
      return;
    const clickPosition = (event as MouseEvent).clientX - this.progressRange.getBoundingClientRect().left;
    const progressRangeWidth = this.progressRange.getBoundingClientRect().width;
    const percentage = (clickPosition / progressRangeWidth) * 100;
    const videoTimeSelected = (percentage * this.video.duration) / 100;
    const videoTimeMax = this.maxProgressBar * this.video.duration / 100;
    if ((videoTimeSelected + this.SECU_TIME) < videoTimeMax) {
      this.video.currentTime = videoTimeSelected;
    }
  }

  onTimeUpdate() {
    if (!this.videoLoaded)
      return;
    const videoTimeMax = this.maxProgressBar * this.video.duration / 100;
    if (this.video.currentTime > videoTimeMax) {
      this.video.currentTime = this.oldCurrentTime;
    }
    else {
      this.oldCurrentTime = this.video.currentTime;
      const value = (this.video.currentTime / this.video.duration) * 100;
      this.progressBar.style.width = value + "%";
    }
    // this.loadingBar.style.width = this.downloadedValue + "%";
    // currentTime.textContent = formatTime(video.currentTime);
    // duration.textContent = formatTime(video.duration);
  }

  ngOnDestroy(): void {
    this.movieService.stopLoadingMovie(this.movieId).subscribe({
      next: (response) => {
        console.log("stopLoadingMovie", response.message);
      },
      error: (error) => {
        console.log(error);
      }
    });
    console.log('ngOnDestroy');
    this.movieService.addMovieHistory(this.imdbId).subscribe({
      next: (response) => {
        console.log("addMovieHistory", response.seen);
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  getLoadingMovie() {
    this.movieService.getLoadingMovie(this.movieId).subscribe({
      next: (response) => {
        // console.log("getLoadingMovie", response)
        this.progressValue = Math.floor(response.data.size * 100 / this.MIN_BYTES);
        this.totalSize = response.data.totalSize;

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

  getMovieFileSize() {
    this.movieService.getMovieFileSize(this.movieId).subscribe({
      next: (response) => {
        // console.log("getMovieFileSize", response)
        const sizeNormalized = (response.data.size - this.SECU_BYTES) / this.totalSize;
        const value = (response.data.size >= this.totalSize) ? 100 : (sizeNormalized * 100)
        this.downloadedValue = value;
        this.maxProgressBar = value;
        // console.log("getMovieFileSize this.totalSize", this.totalSize)
        // console.log("getMovieFileSize this.maxProgressBar", this.maxProgressBar)
        if (this.loadingBar) {
          // console.log("getMovieFileSize this.downloadedValue", this.downloadedValue)
          this.loadingBar.style.width = this.downloadedValue + "%";
        }
        // console.log("getMovieFileSize this.totalSize", this.totalSize)
        if (((this.totalSize > 0 && response.data.size < this.totalSize) || response.data.size == 0)
              && this.router.url == ("/stream/" + this.movieId)) {
          setTimeout(() => {
            this.getMovieFileSize();
          }, 1000);
        }
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  changeVolumeBarDisplaying() {
    if (!this.videoLoaded)
      return;
    this.showVolume = !this.showVolume;
    this.isHidden = !this.isHidden;
  }

  onChangeVolume(event: any) {
    if (!this.videoLoaded)
      return;
    this.video.volume = this.value / 100;
  }

}

