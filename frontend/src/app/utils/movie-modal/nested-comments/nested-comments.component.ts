import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Comment } from 'src/app/models/models';

@Component({
  selector: 'app-nested-comments',
  template: `
    <div class="comments">
      <div *ngFor="let nestedComment of nestedComments" class="comment nested-comment">
        <div class="comment-header">
          <p class="comment-author">{{ nestedComment.author_username }}</p>
          <p class="comment-date">{{ nestedComment.createdAt | date:'medium'}}</p>
        </div>
        <p class="comment-text">{{ nestedComment.text }}</p>
        <button class="comment-reply-button" (click)="replyToNestedComment(nestedComment)">
          <mat-hint class="hint">Reply</mat-hint>
        </button>
        <app-nested-comments [parentComment]="nestedComment" [allComments]="allComments"></app-nested-comments>
      </div>
    </div>
  `,
  styleUrls: ['./nested-comments.component.scss', '../../../app.component.scss']
})
export class NestedCommentsComponent {
  @Input() parentComment!: Comment;
  @Input() allComments!: Comment[];
  @Output() replyToNestedCommentEvent = new EventEmitter<Comment>();

  selectedNestedComment: Comment | null = null;

  get nestedComments(): Comment[] {
    return this.allComments.filter(comment => comment.parent_id === this.parentComment.id);
  }

  replyToNestedComment(comment: Comment) {
    this.selectedNestedComment = comment;
    this.replyToNestedCommentEvent.emit(comment);
  }
}
