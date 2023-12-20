import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommentsService } from 'src/app/services/comments.service';
import { Comment } from 'src/app/models/models';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { MoviesService } from 'src/app/services/movie.service';

@Component({
  selector: 'app-film-modal',
  templateUrl: './movie-modal.component.html',
  styleUrls: ['./movie-modal.component.scss', '../../app.component.scss'],
})
export class MovieModalComponent {
  showComments = false;
  commentForm: FormGroup;
  comments: Comment[] = [];
  replying: boolean = false;
  editing: boolean = false;
  selectedComment: Comment | null = null;
  id: number = this.localStorageService.getItem('id') || null;
  ytsId: number = 0;
  freeMovieId: string = "undefined";

  constructor(
    public dialogRef: MatDialogRef<MovieModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private formBuilder: FormBuilder,
    private commentsService: CommentsService,
    private movieService: MoviesService,
    private localStorageService: LocalStorageService
  ) {
    if (data.yts_id) {
      this.ytsId = data.yts_id;
    } else {
      this.freeMovieId = data.free_movie_id ? data.free_movie_id : "";
    }
    console.log("data", data);
    this.commentsService.getComments(this.data.imdb_id).subscribe({
      next: (response: any) => {
        if (response && response.comments && Array.isArray(response.comments)) {
          this.comments = response.comments;
        } else {
          console.error('Invalid response format:', response);
        }
      }, error: (error) => {
        console.log(error);
      }
    });
    this.commentForm = this.formBuilder.group({
      comment: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(500)]],
    });
    // this.movieService.getTorrentInfos(data.yts_id).subscribe({
    //   next: (response: any) => {
    //     console.log("getTorrentInfos", response);
    //   }, error: (error) => {
    //     console.log(error);
    //   }
    // });
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
    console.log('Replying to comment:', comment);
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
              console.error('Invalid response format:', response);
            }
          }, error: (error) => {
            console.log(error);
          }
        });

      }, error: (error) => {
        console.log(error);
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
          console.log(error);
        }
      });
    } else if (this.selectedComment && this.editing) {
      const updatedComment: Comment = { ...this.selectedComment as Comment, text: comment };
      this.commentsService.updateComment(updatedComment).subscribe({
        next: (response: any) => {
          console.log(response);
          const updatedComment: Comment = { ...response.comment, updatedAt: new Date() };
          this.comments = this.comments.map(comment => comment.id === response.comment.id ? updatedComment : comment);
          console.log(this.comments);
          this.editing = false;
          this.selectedComment = null;
        }, error: (error) => {
          console.log(error);
        }
      });
    } else {
      this.commentsService.addComment(this.data.imdb_id, comment, undefined).subscribe({
        next: (response: any) => {
          this.comments.push(response.comment);
        }, error: (error) => {
          console.log(error);
        }
      });
    }
    this.commentForm.reset();
  }
}
