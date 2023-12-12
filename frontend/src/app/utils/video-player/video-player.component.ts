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

  color: ThemePalette = 'warn';

  MIN_BYTES = 30000000;
  SECU_BYTES = 20000000;
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
  videoControls: any;

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
  videoCurrentTime = "";
  videoDuration = "";

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
      this.movieId = params['ytsId'];
      this.imdbId = params['imdbId'];

      console.log("this.ytsId", this.ytsId)
      console.log("this.imdbId", this.imdbId)
    });
    this.getLoadingMovie();
    this.getMovieFileSize();
    this.videoUrl = this.url + '/movies/movieStream/' + this.movieId;
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
    console.log('Video metadata loaded downloadedValue', this.downloadedValue);
    if (this.downloadedValue > 0 && this.downloadedValue < 100) {
      this.loadingBar.style.width = this.downloadedValue + "%";
    }
    this.videoLoaded = true;
    this.videoControls = document.getElementById('videoControls') as HTMLDivElement;
    this.videoControls.style.display = "block";
    this.videoDuration = this._convertSecondsToTime(this.video.duration);
    this.videoCurrentTime = this._convertSecondsToTime(this.video.currentTime);
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
    console.log("percentage = " + percentage + ", maxProgressBar = " + this.maxProgressBar + ", videoTimeSelected = " + videoTimeSelected + ", videoTimeMax = " + videoTimeMax);
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
    this.videoCurrentTime = this._convertSecondsToTime(this.video.currentTime);
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
    if (this.router.url == ("/stream/" + this.movieId + "/" + this.imdbId)) {
      this.movieService.getLoadingMovie(this.movieId).subscribe({
        next: (response) => {
          this.progressValue = Math.floor(response.data.size * 100 / this.MIN_BYTES);
          this.totalSize = response.data.totalSize;
  
          if (response.data.size < this.MIN_BYTES && this.router.url == ("/stream/" + this.movieId + "/" + this.imdbId)) {
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
  }

  getMovieFileSize() {
    this.movieService.getMovieFileSize(this.movieId).subscribe({
      next: (response) => {
        console.log("getMovieFileSize size = " + response.data.size + ", totalSize = " + this.totalSize);
        const sizeNormalized = (response.data.size - this.SECU_BYTES) / this.totalSize;
        const value = (this.totalSize <= 0) ? 0 : ((response.data.size >= this.totalSize) ? 100 : (sizeNormalized * 100))
        this.downloadedValue = value;
        console.log("getMovieFileSize sizeNormalized = " + sizeNormalized);
        console.log("getMovieFileSize downloadedValue", this.downloadedValue);
        this.maxProgressBar = value;
        if (this.loadingBar) {
          this.loadingBar.style.width = this.downloadedValue + "%";
        }
        console.log("getMovieFileSize this.totalSize = " + this.totalSize + ", response.data.size = " + response.data.size);
        if (((this.totalSize > 0 && response.data.size < this.totalSize) || response.data.size == 0)
              && this.router.url == ("/stream/" + this.movieId + "/" + this.imdbId)) {
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

  fullScreen() {
    if (this.downloadedValue >= this.totalSize && this.totalSize > 0)
      return ;
    this.video.controls = false;
    if (!document.fullscreenElement) {
      if (this.video.requestFullscreen) {
        this.video.requestFullscreen();
      } else if (this.video.mozRequestFullScreen) { /* Firefox */
        this.video.mozRequestFullScreen();
      } else if (this.video.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        this.video.webkitRequestFullscreen();
      } else if (this.video.msRequestFullscreen) { /* IE/Edge */
        this.video.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  _convertSecondsToTime(seconds: number): string {
    const pad = (num: number) => (num < 10 ? '0' : '') + num;
  
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
  
    let timeString = pad(hours) + ':' + pad(minutes) + ':' + pad(secs);
    return timeString;
  }

}

