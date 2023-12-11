import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Comment } from 'src/app/models/models';
import { LocalStorageService } from 'src/app/services/local-storage.service';

@Component({
  selector: 'app-nested-comments',
  template: `
    <div class="comments">
      <div *ngFor="let nestedComment of nestedComments" class="comment nested-comment">
        <div class="comment-header">
          <p class="comment-author">{{ nestedComment.author_username }}</p>
          <p class="comment-date">{{ nestedComment.createdAt === nestedComment.updatedAt ? (nestedComment.createdAt |
            date:'short') : (nestedComment.updatedAt | date:'short') }} {{ nestedComment.createdAt === nestedComment.updatedAt ? '' : '🖋️' }}</p>
        </div>
        <p class="comment-text">{{ nestedComment.text }}</p>
        <button class="comment-reply-button" (click)="replyToNestedComment(nestedComment)">
          <mat-hint class="hint">Reply</mat-hint>
        </button>
        <button *ngIf="nestedComment.author_id === id" class="comment-reply-button" (click)="editNestedComment(nestedComment)">
          <mat-hint class="hint">Edit</mat-hint>
        </button>
        <button *ngIf="nestedComment.author_id === id" class="comment-reply-button" (click)="deleteNestedComment(nestedComment)">
          <mat-hint class="hint">Delete</mat-hint>
        </button>
        <app-nested-comments (replyToNestedCommentEvent)="replyToNestedComment($event)" (editNestedCommentEvent)="editNestedComment($event)" [parentComment]="nestedComment" [allComments]="allComments" [replying]="replying"></app-nested-comments>
      </div>
    </div>
  `,
  styleUrls: ['./nested-comments.component.scss', '../../../app.component.scss']
})
export class NestedCommentsComponent {
  constructor(
    private localStorageService: LocalStorageService
  ) { }
  @Input() parentComment!: Comment;
  @Input() allComments!: Comment[];
  @Input() replying!: boolean;
  @Input() editing!: boolean;
  @Output() replyToNestedCommentEvent = new EventEmitter<Comment>();
  @Output() editNestedCommentEvent = new EventEmitter<Comment>();
  @Output() deleteNestedCommentEvent = new EventEmitter<Comment>();

  selectedNestedComment: Comment | null = null;
  id = this.localStorageService.getItem('id') || null;

  get nestedComments(): Comment[] {
    return this.allComments.filter(comment => comment.parent_id === this.parentComment.id);
  }

  replyToNestedComment(comment: Comment) {
    this.selectedNestedComment = comment;
    this.replyToNestedCommentEvent.emit(comment);
  }

  editNestedComment(comment: Comment) {
    this.selectedNestedComment = comment;
    this.editNestedCommentEvent.emit(comment);
  }

  deleteNestedComment(comment: Comment) {
    this.deleteNestedCommentEvent.emit(comment);
  }

  ngOnChanges() {
    if (!this.replying) {
      this.selectedNestedComment = null;
    }
    if (!this.editing) {
      this.selectedNestedComment = null;
    }
  }
}
