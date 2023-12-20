import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SafeResourceUrl } from '@angular/platform-browser'
import { environment } from 'src/environments/environment.template';
import { ThemePalette } from '@angular/material/core';
import { MoviesService } from 'src/app/services/movie.service';
import { DialogService } from 'src/app/services/dialog.service';
import { SubtitlesItemResponse, languages } from 'src/app/models/models';
import { LocalStorageService } from 'src/app/services/local-storage.service';

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
  @Input()
  movieTitle!: any;

  color: ThemePalette = 'warn';

  MIN_BYTES = 150000000;
  SECU_BYTES = 100000000;
  SECU_TIME = 0;

  movieId = 0;
  freeId = "";
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
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      console.log("params", params);
      this.movieId = params['ytsId'];
      this.freeId = params['freeId'];
      this.imdbId = params['imdbId'];
      this.movieTitle = params['title'];
    });
    const userLanguage = this.localStorageService.getItem("language");
    console.log("userLanguage", userLanguage);
    const languages = (userLanguage != null && userLanguage.length > 0 && userLanguage != "en") ? ['en', userLanguage] : ['en'];
    this.movieService.downloadSubtitles(this.imdbId, languages).subscribe({
      next: (response) => {
        console.log("downloadSubtitles", response);
        const subtitlesReceived = response.subtitles;
        this.subtitlesErrorMessage = "";
        subtitlesReceived.forEach((sub: SubtitlesItemResponse) => {
          if (sub.filePath == null || sub.filePath.length <= 0) {
            this.subtitlesError = true;
            this.subtitlesErrorMessage = this.subtitlesErrorMessage + sub.error + " (" + sub.lang + ")\n";
          }
        });
        console.log("subtitlesReceived", subtitlesReceived);
        this.subtitles = subtitlesReceived;
        if (this.videoLoaded) {
          console.log("this.subtitles get", this.subtitles)
          this._addSubtitles();
        }
      },
      error: (error) => {
        console.log(error);
        this.subtitlesError = true;
        this.subtitlesErrorMessage = "Error with subtitles api";
      }
    });
    this.getLoadingMovie();
    this.getMovieFileSize();
    this.videoUrl = this.url + '/movies/movieStream/' + this.movieId + '/' + this.freeId;
    this.subUrl = this.url + '/movies/testMovies';
  }

  addSubtitlesToVideo(subtitles: string) {
    const videoElement = document.querySelector('video');
    
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
    this.bytesPerSeconds = this.totalSize / this.video.duration;

    this._addSubtitles();

  }

  _addSubtitles() {
    if (this.subtitles != null && this.subtitles.length > 0) {
      this.subtitles.forEach((sub: SubtitlesItemResponse) => {
        console.log("sub", sub)
        if (sub.filePath != null && sub.filePath.length > 0) {
          this.movieService.getSubtitles(sub.filePath).subscribe(subtitles => {
            const blob = new Blob([subtitles], { type: 'webvtt' });
            console.log("blob", blob)
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

  changeSubtitles(newSub: {value: string, viewValue: string}) {
    console.log("changeSubtitles", newSub)
    if (newSub.value != this.currentSubtitles) {
      console.log("change ok")
      const tracks = this.video.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        console.log("track", track)
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
      const videoTimeMax = this.maxProgressBar * this.video.duration / 100;
      if (this.video.currentTime >= videoTimeMax) {
        console.log("force pause togglevideo")
        return;
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
    const videoTimeSelected = (percentage * this.video.duration) / 100;
    const videoTimeMax = this.maxProgressBar * this.video.duration / 100;
    console.log("percentage = " + percentage + ", maxProgressBar = " + this.maxProgressBar + ", videoTimeSelected = " + videoTimeSelected + ", videoTimeMax = " + videoTimeMax + ", this.totalSize = " + this.totalSize);
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
      console.log("force pause onTimeUpdate 1")
      this.video.pause();
      this.videoPlaying = false;
      this.videoPlayButtonIcon = "play_arrow";
      const data = {
        title: 'Download error',
        text: 'There is an issue with the download. This may be due to an internet connection problem.',
        text_yes_button: 'Ok',
        yes_callback: () => { },
        reload: false,
      };
      this.dialogService.openDialog(data);
    }
    else {
      this.oldCurrentTime = this.video.currentTime;
      const value = (this.video.currentTime / this.video.duration) * 100;
      this.progressBar.style.width = value + "%";
    }
    this.videoCurrentTime = this._convertSecondsToTime(this.video.currentTime);
    if (this.videoPlaying && this.video.currentTime >= videoTimeMax) {
      console.log("force pause onTimeUpdate 2")
      this.video.pause();
      this.videoPlaying = false;
      this.videoPlayButtonIcon = "play_arrow";
    }
  }

  ngOnDestroy(): void {
    this.movieService.stopLoadingMovie(this.movieId, this.freeId).subscribe({
      next: (response) => {
        console.log("stopLoadingMovie", response.message);
      },
      error: (error) => {
        console.log(error);
      }
    });
    console.log('ngOnDestroy');
    this.movieService.addMovieHistory(this.imdbId, this.movieTitle).subscribe({
      next: (response) => {
        console.log("addMovieHistory", response.seen);
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  getLoadingMovie() {
    if (this.router.url.includes("/stream/" + this.movieId)) {
      // console.log("getLoadingMovie " + this.movieId + " " + this.freeId);
      this.movieService.getLoadingMovie(this.movieId, this.freeId, this.imdbId).subscribe({
        next: (response) => {
          // console.log("getLoadingMovie", response.data);
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
          this.progressValue = Math.floor(response.data.size * 100 / this.MIN_BYTES);
          this.totalSize = response.data.totalSize;
          // console.log("this.totalSize", this.totalSize)
          if (this.totalSize > 0 && this.totalSize <= this.MIN_BYTES) {
            this.MIN_BYTES = this.totalSize;
          }

          if (response.data.size < this.MIN_BYTES && this.router.url.includes("/stream/" + this.movieId)) {
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
    this.movieService.getMovieFileSize(this.movieId, this.freeId).subscribe({
      next: (response) => {
        // console.log("getMovieFileSize size = " + response.data.size + ", totalSize = " + this.totalSize);
        const sizeNormalized = (response.data.size - this.SECU_BYTES) / this.totalSize;
        const value = (this.totalSize <= 0) ? 0 : ((response.data.size >= this.totalSize) ? 100 : (sizeNormalized * 100))
        this.downloadedValue = value;
        // console.log("getMovieFileSize sizeNormalized = " + sizeNormalized);
        // console.log("getMovieFileSize downloadedValue", this.downloadedValue);
        this.maxProgressBar = value >= 100 ? 100 : value;
        if (this.loadingBar) {
          this.loadingBar.style.width = this.downloadedValue + "%";
        }
        // console.log("getMovieFileSize this.totalSize = " + this.totalSize + ", response.data.size = " + response.data.size);
        if (((this.totalSize > 0 && response.data.size < this.totalSize) || response.data.size == 0 || this.totalSize == 0)
          && this.router.url.includes("/stream/" + this.movieId)) {
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
      return;
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

