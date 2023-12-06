import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.template';
import { LocalStorageService } from './local-storage.service';
import { Comment } from '../models/models';


@Injectable({
    providedIn: 'root'
})
export class CommentsService {
    private apiUrl = environment.backendUrl + '/comments';

    constructor(
        private http: HttpClient,
        private localStorageService: LocalStorageService
    ) { }

    getComments(imdb_id: string): Observable<any[]> {
        return this.http.get<Comment[]>(this.apiUrl + '/getComments/' + imdb_id, { withCredentials: true });
    }

    addComment(imdb_id: string, comment: Comment, parent_id: number | undefined): Observable<Comment> {
        return this.http.post<Comment>(this.apiUrl + '/addComment/', { author_id: this.localStorageService.getItem('id'), imdb_id, text: comment, parent_id }, { withCredentials: true });
    }

    updateComment(comment: Comment): Observable<Comment> {
        console.log(comment);
        return this.http.put<Comment>(this.apiUrl + '/updateComment/', { comment: comment }, { withCredentials: true });
    }
}
