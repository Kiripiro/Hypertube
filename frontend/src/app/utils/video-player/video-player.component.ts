import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SafeResourceUrl } from '@angular/platform-browser'
import { environment } from 'src/environments/environment.template';
import { ThemePalette } from '@angular/material/core';
import { MoviesService } from 'src/app/services/movie.service';
import { DialogService } from 'src/app/services/dialog.service';
import { SubtitlesItemResponse, languages } from 'src/app/models/models';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { Subject, timer } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss', '../../app.component.scss']
})
export class VideoPlayerComponent implements OnInit, AfterViewInit {
  @Input()
  durationData!: number;

  color: ThemePalette = 'warn';

  MIN_BYTES = 150000000;
  SECU_BYTES = 100000000;
  SECU_TIME = 0;
  SECU_TIME_CONVERTED = 120;
  TIMER_BEFORE_ERROR = 30000;

  movieId = 0;
  freeId = "";
  imdbId = "";
  movieTitle = "";
  loaded = false;
  videoLoaded = false;
  private loadedSubject = new Subject<boolean>();
  private videoLoadedSubject = new Subject<boolean>();
  error = false;
  progressValue = 0;
  totalSize = 0;
  downloadedValue = 0;
  isMKV = false;
  isWebm = false;
  sourceType = "video/mp4";

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
  bytesPerSeconds = 0;

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
  videoDurationSeconds = 0;
  timeExpected = 0;

  subUrl: SafeResourceUrl | undefined;

  sub: any;

  subtitlesError = false;
  subtitlesErrorMessage = "";
  subtitles: SubtitlesItemResponse[] = [];
  subtitlesChoiceToDisplay = [{ value: 'none', viewValue: 'None' }];
  currentSubtitles = "none";

  constructor(
    private route: ActivatedRoute,
    private movieService: MoviesService,
    private router: Router,
    private dialogService: DialogService,
    private localStorageService: LocalStorageService
  ) {
    this.url = environment.backendUrl || 'http://localhost:3000';
    this.loadedSubject.pipe(
        takeWhile(() => this.loaded === true && this.videoLoaded === false)
    ).subscribe(() => {
        const tenSecondsTimer = timer((this.isMKV ? (this.TIMER_BEFORE_ERROR * 3) : this.TIMER_BEFORE_ERROR));
        tenSecondsTimer.subscribe(() => {
            if (!this.videoLoaded) {
              const data = {
                title: 'Video player error',
                text: 'The video player did not load correctly, please reload the page',
                text_yes_button: 'Reload',
                yes_callback: () => { },
                text_no_button: 'Ok',
                no_callback: () => { },
                reload: true,
              };
              this.dialogService.openDialog(data);
            }
        });
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.movieId = params['ytsId'];
      this.freeId = params['freeId'];
      this.imdbId = params['imdbId'];
      this.movieTitle = params['title'];
      const timeConverted = this.movieService._convertTime(params['time'] ? params['time'] : "0");
      if (timeConverted == -1) {
        this.error = true;
        const data = {
          title: 'Time parameter error',
          text: '',
          text_yes_button: 'Ok',
          yes_callback: () => { },
          reload: false,
        };
        this.dialogService.openDialog(data);
      } else {
        if (timeConverted > this.durationData * 60) {
          this.error = true;
          const data = {
            title: 'Time parameter error',
            text: '',
            text_yes_button: 'Ok',
            yes_callback: () => { },
            reload: false,
          };
          this.dialogService.openDialog(data);
        } else if (timeConverted > ((this.durationData * 60) - this.SECU_TIME_CONVERTED)) {
          this.timeExpected = (this.durationData * 60) - this.SECU_TIME_CONVERTED;
        } else {
          this.timeExpected = timeConverted;
        }
      }
    });
    const userLanguage = this.localStorageService.getItem("language");
    const languages = (userLanguage != null && userLanguage.length > 0 && userLanguage != "en") ? ['en', userLanguage] : ['en'];
    this.movieService.downloadSubtitles(this.imdbId, languages, this.timeExpected).subscribe({
      next: (response) => {
        const subtitlesReceived = response.subtitles;
        this.subtitlesErrorMessage = "";
        subtitlesReceived.forEach((sub: SubtitlesItemResponse) => {
          if (sub.filePath == null || sub.filePath.length <= 0) {
            this.subtitlesError = true;
            this.subtitlesErrorMessage = this.subtitlesErrorMessage + sub.error + " (" + sub.lang + ")\n";
          }
        });
        this.subtitles = subtitlesReceived;
        if (this.videoLoaded) {
          this._addSubtitles();
        }
      },
      error: (error) => {
        this.subtitlesError = true;
        this.subtitlesErrorMessage = "Error with subtitles api";
      }
    });
    this.getLoadingMovie();
    this.getMovieFileSize();
    if (this.freeId == null || this.freeId == undefined || this.freeId == "undefined") {
      this.freeId = "tt0";
    }
    this.videoUrl = this.url + '/movie/movieStream/' + this.movieId + '/' + this.freeId + '/' + this.timeExpected;
    this.subUrl = this.url + '/movie/testMovies';
  }

  addSubtitlesToVideo(subtitles: string) {
    const videoElement = document.querySelector('video');

  }

  ngAfterViewInit() {

  }

  onVideoLoad() {
    this.video = document.getElementById('videoPlayerOrigin') as HTMLVideoElement;
    this.videoDurationSeconds = this.isMKV ? (this.durationData * 60) : this.video.duration;
    this.video.disablePictureInPicture = true;
    this.videoPlayButton = document.getElementById('videoPlayButton') as HTMLButtonElement;
    this.progressRange = document.getElementById('progressRange') as HTMLDivElement;
    this.progressBar = document.getElementById('progressBar') as HTMLDivElement;
    if (this.isMKV) {
      const value = ((this.timeExpected + this.video.currentTime) / this.videoDurationSeconds) * 100;
      this.progressBar.style.width = value + "%";
    } else {
      const value = (this.video.currentTime / this.videoDurationSeconds) * 100;
      this.progressBar.style.width = value + "%";
    }
    this.loadingBar = document.getElementById('loadingBar') as HTMLDivElement;
    this.value = this.video.volume * 100;
    if (this.downloadedValue > 0 && this.downloadedValue < 100) {
      this.loadingBar.style.width = this.downloadedValue + "%";
    }
    this.videoLoaded = true;
    this.videoLoadedSubject.next(true);
    this.videoControls = document.getElementById('videoControls') as HTMLDivElement;
    this.videoControls.style.display = "block";
    this.videoDuration = this._convertSecondsToTime(this.videoDurationSeconds);
    if (this.isMKV) {
      this.videoCurrentTime = this._convertSecondsToTime(this.timeExpected + this.video.currentTime);
    } else {
      this.videoCurrentTime = this._convertSecondsToTime(this.video.currentTime);
    }
    this.bytesPerSeconds = this.totalSize / this.videoDurationSeconds;
    this._addSubtitles();
  }

  _addSubtitles() {
    if (this.subtitles != null && this.subtitles.length > 0) {
      this.subtitles.forEach((sub: SubtitlesItemResponse) => {
        if (sub.filePath != null && sub.filePath.length > 0) {
          this.movieService.getSubtitles(sub.filePath).subscribe(subtitles => {
            const blob = new Blob([subtitles], { type: 'webvtt' });
            const subBlobUrl = URL.createObjectURL(blob);
            const track = document.createElement('track');
            track.kind = 'subtitles';
            const labelToDisplay = languages.find((lang) => lang.value == sub.lang)?.viewValue || sub.lang;
            track.label = sub.lang;
            track.srclang = sub.lang;
            track.src = subBlobUrl;
            this.video.appendChild(track);
            this.subtitlesChoiceToDisplay.push({ value: sub.lang, viewValue: labelToDisplay });
          });
        }
      });
    }
  }

  changeSubtitles(newSub: { value: string, viewValue: string }) {
    if (newSub.value != this.currentSubtitles) {
      const tracks = this.video.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (track.language == newSub.value) {
          track.mode = 'showing';
          this.currentSubtitles = newSub.value;
        } else {
          track.mode = 'hidden';
        }
      }
      if (newSub.value == "none") {
        this.currentSubtitles = "none";
      }
    }
  }

  togglevideo() {
    if (!this.videoLoaded)
      return;
    if (!this.videoPlaying) {
      const videoTimeMax = this.maxProgressBar * this.videoDurationSeconds / 100;
      if (this.video.currentTime >= videoTimeMax) {
        return;
      }
      if (this.isMKV && this.video.currentTime >= this.video.duration) {
        return ;
      }
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
    const videoTimeSelected = (percentage * this.videoDurationSeconds) / 100;
    const videoTimeMax = this.maxProgressBar * this.videoDurationSeconds / 100;
    // console.log("percentage = " + percentage + ", maxProgressBar = " + this.maxProgressBar + ", videoTimeSelected = " + videoTimeSelected + ", videoTimeMax = " + videoTimeMax + ", this.totalSize = " + this.totalSize);
    if ((videoTimeSelected + this.SECU_TIME) < videoTimeMax) {
      // console.log("this.video.currentTime = " + this.video.currentTime + ", videoTimeSelected = " + videoTimeSelected + ", videoTimeMax = " + videoTimeMax + ", this.video.duration = " + this.video.duration)
      if (this.isMKV) {
        this._realoadWithTime(Math.floor(videoTimeSelected));
      } else {
        this.video.currentTime = videoTimeSelected;
      }
    }
  }

  _realoadWithTime(time: number) {
    this.router.navigate(['stream/' + this.movieId + '/' + this.imdbId + '/' + this.movieTitle + '/' + this.freeId + '/' + time]).then(() => {
      window.location.reload();
    });
  }

  onTimeUpdate() {
    if (!this.videoLoaded)
      return;
    const videoTimeMax = this.maxProgressBar * this.videoDurationSeconds / 100;
    if (this.isMKV && this.video.currentTime >= this.video.duration) {
      this.video.pause();
      this.videoPlaying = false;
      this.videoPlayButtonIcon = "play_arrow";
      return ;
    }
    if (this.video.currentTime > videoTimeMax) {
      if (this.video.currentTime >= this.videoDurationSeconds) {
        this.video.pause();
        this.videoPlaying = false;
        this.videoPlayButtonIcon = "play_arrow";
        return;
      }
      this.video.currentTime = this.oldCurrentTime;
      this.video.pause();
      this.videoPlaying = false;
      this.videoPlayButtonIcon = "play_arrow";
      const data = {
        title: 'Download error',
        text: 'There is an issue with the download. This may be due to an internet connection problem. Wait or reload the page.',
        text_yes_button: 'Ok',
        yes_callback: () => { },
        reload: false,
      };
      this.dialogService.openDialog(data);
    }
    else {
      this.oldCurrentTime = this.video.currentTime;
      if (this.isMKV) {
        const value = ((this.timeExpected + this.video.currentTime) / this.videoDurationSeconds) * 100;
        this.progressBar.style.width = value + "%";
      } else {
        const value = (this.video.currentTime / this.videoDurationSeconds) * 100;
        this.progressBar.style.width = value + "%";
      }
    }
    if (this.isMKV) {
      this.videoCurrentTime = this._convertSecondsToTime(this.timeExpected + this.video.currentTime);
    } else {
      this.videoCurrentTime = this._convertSecondsToTime(this.video.currentTime);
    }
    if (this.videoPlaying && this.video.currentTime >= videoTimeMax) {
      this.video.pause();
      this.videoPlaying = false;
      this.videoPlayButtonIcon = "play_arrow";
    }
  }

  ngOnDestroy(): void {
    // this.movieService.stopLoadingMovie(this.movieId, this.freeId).subscribe({
    //   next: (response) => {
    //     console.log("stopLoadingMovie", response.message);
    //   },
    //   error: (error) => {
    //     console.log(error);
    //   }
    // });
    if (this.oldCurrentTime > 0) {
      this.movieService.addMovieHistory(this.imdbId, this.movieTitle, this.oldCurrentTime).subscribe({
        next: (response) => {
        },
        error: (error) => {
        }
      });
    }
  }

  getLoadingMovie() {
    if (this.router.url.includes("/stream/" + this.movieId)) {
      this.movieService.getLoadingMovie(this.movieId, this.freeId, this.imdbId).subscribe({
        next: (response) => {
          if (response.data.downloadError) {
            const data = {
              title: 'Download error',
              text: 'There is an issue with the download. This may be due to an internet connection problem.',
              text_yes_button: 'Ok',
              yes_callback: () => { },
              reload: false,
            };
            this.dialogService.openDialog(data);
            return;
          }
          if (response.data.isMKV) {
            this.isMKV = true;
          }
          if (response.data.isWebm) {
            this.isWebm = true;
            this.sourceType = "video/webm";
          }
          this.progressValue = Math.floor(response.data.size * 100 / this.MIN_BYTES);
          this.totalSize = response.data.totalSize;
          if (this.totalSize > 0 && this.totalSize <= this.MIN_BYTES) {
            this.MIN_BYTES = this.totalSize;
          }

          if (response.data.size < this.MIN_BYTES && this.router.url.includes("/stream/" + this.movieId)) {
            setTimeout(() => {
              this.getLoadingMovie();
            }, 5000);
          } else if (response.data.size >= this.MIN_BYTES) {
            this.loaded = true;
            this.loadedSubject.next(true);
          }
        },
        error: (error) => {
          const data = {
            title: 'Stream error',
            text: error.error.message,
            text_yes_button: 'Ok',
            yes_callback: () => { },
            reload: false,
          };
          this.dialogService.openDialog(data);
        }
      });
    }
  }

  getMovieFileSize() {
    this.movieService.getMovieFileSize(this.movieId, this.freeId).subscribe({
      next: (response) => {
        const sizeNormalized = (response.data.size - this.SECU_BYTES) / this.totalSize;
        const value = (this.totalSize <= 0) ? 0 : ((response.data.size >= this.totalSize) ? 100 : (sizeNormalized * 100))
        this.downloadedValue = value;
        this.maxProgressBar = value >= 100 ? 100 : value;
        if (this.loadingBar) {
          this.loadingBar.style.width = this.downloadedValue + "%";
        }
        if (((this.totalSize > 0 && response.data.size < this.totalSize) || response.data.size == 0 || this.totalSize == 0)
          && this.router.url.includes("/stream/" + this.movieId)) {
          setTimeout(() => {
            this.getMovieFileSize();
          }, 1000);
        }
      },
      error: (error) => {
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
    if (!this.isMKV && this.downloadedValue >= this.totalSize && this.totalSize > 0) {
      this.video.controls = false;
      if (!document.fullscreenElement) {
        if (this.video.requestFullscreen) {
          this.video.requestFullscreen();
        } else if (this.video.mozRequestFullScreen) {
          this.video.mozRequestFullScreen();
        } else if (this.video.webkitRequestFullscreen) {
          this.video.webkitRequestFullscreen();
        } else if (this.video.msRequestFullscreen) {
          this.video.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
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

