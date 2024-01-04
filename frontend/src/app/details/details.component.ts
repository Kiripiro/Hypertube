import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MoviesService } from '../services/movie.service';
import { ThemePalette } from '@angular/material/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommentsService } from 'src/app/services/comments.service';
import { Comment } from 'src/app/models/models';
import { LocalStorageService } from 'src/app/services/local-storage.service';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss', '../app.component.scss']
})
export class DetailsComponent implements OnInit {

  ytsId = 0;
  imdbId = '';
  imdbData: any;
  duration = 0;

  posterUrl = "";

  success = false;
  error = false;
  loading = true;

  comments: Comment[] = [];
  replying: boolean = false;
  editing: boolean = false;
  selectedComment: Comment | null = null;
  commentForm: FormGroup = this.formBuilder.group({
    comment: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(500)]],
  });
  id: number = this.localStorageService.getItem('id') || null;


  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private moviesService: MoviesService,
    private commentsService: CommentsService,
    private localStorageService: LocalStorageService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.ytsId = params['ytsId'];
      this.imdbId = params['imdbId'];
      this.moviesService.getMovieDetails(this.imdbId).subscribe({
        next: (response) => {
          this.imdbData = response.movie;
          this.posterUrl = this.imdbData.poster;
          this.loading = false;
          this.success = true;
          this.duration = this.convertDurationToNumber(this.imdbData.runtime);
        },
        error: (error) => {
          this.error = true;
        }
      });
    })
    this.commentsService.getComments(this.imdbId).subscribe({
      next: (response: any) => {
        if (response && response.comments && Array.isArray(response.comments)) {
          this.comments = response.comments;
        } else {
          console.error('Invalid response format:', response);
        }
      }, error: (error) => {
      }
    });
  }

    convertDurationToNumber(duration: string): number {
    const result = duration.match(/\d+/g);
    if (result) {
      return parseInt(result[0], 10);
    }
    return 0;
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
        this.commentsService.getComments(this.imdbId).subscribe({
          next: (response: any) => {
            if (response && response.comments && Array.isArray(response.comments)) {
              this.comments = response.comments;
            } else {
              console.error('Invalid response format:', response);
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
      this.commentsService.addComment(this.imdbId, comment, this.selectedComment.id).subscribe({
        next: (response: any) => {
          this.comments.push(response.comment);
          this.replying = false;
          this.selectedComment = null;
        }, error: (error) => {
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
        }
      });
    } else {
      this.commentsService.addComment(this.imdbId, comment, undefined).subscribe({
        next: (response: any) => {
          this.comments.push(response.comment);
        }, error: (error) => {
        }
      });
    }
    this.commentForm.reset();
  }

}

