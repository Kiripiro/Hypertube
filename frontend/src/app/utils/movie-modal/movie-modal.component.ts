import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommentsService } from 'src/app/services/comments.service';
import { Comment } from 'src/app/models/models';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { MoviesService } from 'src/app/services/movie.service';
import { HomeService } from 'src/app/services/home.service';
import { DialogService } from 'src/app/services/dialog.service';

@Component({
  selector: 'app-film-modal',
  templateUrl: './movie-modal.component.html',
  styleUrls: ['./movie-modal.component.scss', '../../app.component.scss'],
})
export class MovieModalComponent {
  showComments = false;
  commentForm: FormGroup = this.formBuilder.group({
    comment: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(500)]],
  });
  comments: Comment[] = [];
  replying: boolean = false;
  editing: boolean = false;
  selectedComment: Comment | null = null;
  id: number = this.localStorageService.getItem('id') || null;
  ytsId: number = 0;
  freeMovieId: string = "undefined";
  data: any;
  loading = true;
  error = false;

  constructor(
    public dialogRef: MatDialogRef<MovieModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dataReceived: any,
    private formBuilder: FormBuilder,
    private commentsService: CommentsService,
    private movieService: MoviesService,
    private localStorageService: LocalStorageService,
    private dialogService: DialogService,
    private homeService: HomeService,
  ) {
    this.homeService.getMovieDetails(dataReceived.imdb_id).subscribe({
      next: (response: any) => {
        const movie = response.movie;
        const dataReceivedResponse = {
          id: dataReceived.id,
          title: dataReceived.title,
          director: dataReceived.director || movie.director,
          release_date: dataReceived.release_date || movie.release_date,
          writer: dataReceived.writer || movie.writer,
          actors: dataReceived.actors || movie.actors,
          genre: dataReceived.genre,
          language: dataReceived.language || movie.language,
          plot: movie.plot ? movie.plot : dataReceived.plot,
          awards: dataReceived.awards || movie.awards,
          poster_path: this.dataReceived.poster_path || movie.poster_path,
          imdb_id: dataReceived.imdb_id,
          imdb_rating: dataReceived.imdb_rating,
          yts_id: dataReceived.yts_id,
          free_movie_id: dataReceived.free_movie_id
        };
        this.data = dataReceivedResponse;
        if (this.data.yts_id) {
          this.ytsId = this.data.yts_id;
        } else {
          this.freeMovieId = this.data.free_movie_id ? this.data.free_movie_id : "";
        }
        this.loading = false;
        this.commentsService.getComments(this.data.imdb_id).subscribe({
          next: (response: any) => {
            if (response && response.comments && Array.isArray(response.comments)) {
              this.comments = response.comments;
            } else {
              console.error('Invalid response format:', response);
            }
          }, error: (error) => {
            
            const dialogData = {
              title: "Error",
              content: "An error occured, please try again later",
              positive: "Ok",
              negative: "",
              action: "error"
            };
            this.dialogService.openDialog(dialogData);
          }
        });
        
      },
      error: (error) => {
        this.error = true;
      }
    });
  }

  isStringType(data: any): boolean {
    return typeof data === 'string';
  }

  handleReplyToNestedComment(selectedComment: Comment) {
    this.replying = true;
    this.replyToComment(selectedComment);
  }
  handleEditNestedComment(selectedComment: Comment) {
    this.editComment(selectedComment);
  }

  handleDeleteNestedComment(selectedComment: Comment) {
    this.deleteComment(selectedComment);
  }

  close(): void {
    this.dialogRef.close();
  }

  showCommentsToggle() {
    this.showComments = !this.showComments;
    if (!this.showComments) {
      this.replying = false;
      this.selectedComment = null;
    }
  }

  replyToComment(comment: Comment | null = null) {
    if (comment) {
      this.selectedComment = comment;
      this.replying = true;
      this.editing = false;
    }
  }

  cancelReplyOrEdit() {
    if (this.replying) {
      this.replying = false;
      this.selectedComment = null;
    }
    if (this.editing) {
      this.editing = false;
      this.selectedComment = null;
    }
    this.commentForm.reset();
  }

  editComment(comment: Comment) {
    this.selectedComment = comment;
    this.editing = true;
    this.replying = false;
    this.commentForm.setValue({ comment: comment.text });
  }

  deleteComment(comment: Comment) {
    this.commentsService.deleteComment(comment).subscribe({
      next: (response: any) => {
        this.commentsService.getComments(this.data.imdb_id).subscribe({
          next: (response: any) => {
            if (response && response.comments && Array.isArray(response.comments)) {
              this.comments = response.comments;
            } else {
            }
          }, error: (error) => {
          }
        });

      }, error: (error) => {
      }
    });
  }

  onSubmit() {
    if (this.commentForm.invalid) {
      return;
    }
    const comment = this.commentForm.value.comment;
    if (this.selectedComment && this.replying && !this.editing) {
      this.commentsService.addComment(this.data.imdb_id, comment, this.selectedComment.id).subscribe({
        next: (response: any) => {
          this.comments.push(response.comment);
          this.replying = false;
          this.selectedComment = null;
        }, error: (error) => {
          const dialogData = {
            title: 'Error',
            text: 'An error has occured',
            text_yes_button: "",
            text_no_button: "Close",
            yes_callback: () => { },
            no_callback: () => { },
            reload: true
          };
          this.dialogService.openDialog(dialogData);
        }
      });
    } else if (this.selectedComment && this.editing) {
      const updatedComment: Comment = { ...this.selectedComment as Comment, text: comment };
      this.commentsService.updateComment(updatedComment).subscribe({
        next: (response: any) => {
          const updatedComment: Comment = { ...response.comment, updatedAt: new Date() };
          this.comments = this.comments.map(comment => comment.id === response.comment.id ? updatedComment : comment);
          this.editing = false;
          this.selectedComment = null;
        }, error: (error) => {
          const dialogData = {
            title: 'Error',
            text: 'An error has occured',
            text_yes_button: "",
            text_no_button: "Close",
            yes_callback: () => { },
            no_callback: () => { },
            reload: true
          };
          this.dialogService.openDialog(dialogData);
        }
      });
    } else {
      this.commentsService.addComment(this.data.imdb_id, comment, undefined).subscribe({
        next: (response: any) => {
          this.comments.push(response.comment);
        }, error: (error) => {
          const dialogData = {
            title: 'Error',
            text: 'An error has occured',
            text_yes_button: "",
            text_no_button: "Close",
            yes_callback: () => { },
            no_callback: () => { },
            reload: true
          };
          this.dialogService.openDialog(dialogData);
        }
      });
    }
    this.commentForm.reset();
  }
}
