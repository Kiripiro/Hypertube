import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    CheckLikeResponseData,
    CheckMatchResponseData,
    CreateBlockResponseData,
    CreateLikeResponseData,
    CreateReportResponseData,
    CreateViewResponseData,
    DeleteBlockResponseData,
    DeleteLikeResponseData,
    DeleteReportResponseData,
    GetAllProfileLikesResponseData,
    GetAllProfileViewsResponseData
} from 'src/app/models/models';
import { environment } from 'src/environments/environment.template';

@Injectable({
    providedIn: 'root'
})
export class RelationService {
    url: string;
    constructor(
        private http: HttpClient
    ) {
        this.url = environment.backendUrl || 'http://localhost:3000';
    }

    getCheckLike(authorId: Number, recipientId: Number): Observable<CheckLikeResponseData> {
        return this.http.get<CheckLikeResponseData>(this.url + '/likes/check/' + authorId + '/' + recipientId, { withCredentials: true });
    }

    getCheckMatch(authorId: Number, recipientId: Number): Observable<CheckMatchResponseData> {
        return this.http.get<CheckMatchResponseData>(this.url + '/likes/checkMatch/' + authorId + '/' + recipientId, { withCredentials: true });
    }

    createLike(authorId: Number, recipientId: Number): Observable<CreateLikeResponseData> {
        return this.http.post<CreateLikeResponseData>(this.url + '/likes/create', { authorId, recipientId }, { withCredentials: true });
    }

    deleteLike(authorId: Number, recipientId: Number): Observable<DeleteLikeResponseData> {
        return this.http.post<DeleteLikeResponseData>(this.url + '/likes/delete', { authorId, recipientId }, { withCredentials: true });
    }

    createView(authorId: Number, recipientId: Number) {
        return this.http.post<CreateViewResponseData>(this.url + '/views/create', { authorId, recipientId }, { withCredentials: true });
    }

    createBlock(authorId: Number, recipientId: Number): Observable<CreateBlockResponseData> {
        return this.http.post<CreateBlockResponseData>(this.url + '/blocks/create/', { author_id: authorId, recipient_id: recipientId }, { withCredentials: true });
    }

    deleteBlock(authorId: Number, recipientId: Number): Observable<DeleteBlockResponseData> {
        return this.http.post<DeleteBlockResponseData>(this.url + '/blocks/delete/users', { author_id: authorId, recipient_id: recipientId }, { withCredentials: true });
    }

    createReport(authorId: Number, recipientId: Number): Observable<CreateReportResponseData> {
        return this.http.post<CreateReportResponseData>(this.url + '/reports/create/', { author_id: authorId, recipient_id: recipientId }, { withCredentials: true });
    }

    deleteReport(authorId: Number, recipientId: Number): Observable<DeleteReportResponseData> {
        return this.http.post<DeleteReportResponseData>(this.url + '/reports/delete/users', { author_id: authorId, recipient_id: recipientId }, { withCredentials: true });
    }

    getAllProfileViews(recipientId: number) {
        return this.http.get<GetAllProfileViewsResponseData>(this.url + '/views/recipient/' + recipientId, { withCredentials: true });
    }

    getAllProfileLikes(recipientId: number) {
        return this.http.get<GetAllProfileLikesResponseData>(this.url + '/likes/recipient/' + recipientId, { withCredentials: true });
    }
}