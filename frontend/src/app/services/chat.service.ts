import { Observable, forkJoin, map, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { LocalStorageService } from './local-storage.service';
import { Injectable } from '@angular/core';
import { SocketioService } from './socketio.service';
import { User, Message, GetUserResponseData } from '../models/models';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment.template';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private url = environment.backendUrl;
    private id: number;

    constructor(
        private http: HttpClient,
        private localStorageService: LocalStorageService,
        private socketService: SocketioService,
        private authService: AuthService
    ) {
        this.id = this.localStorageService.getItem('id');
    }

    public initSocket(): void {
        this.socketService.initSocket();
    }

    getMatches(): Observable<User[]> {
        return this.http.get<any[]>(this.url + '/likes/matches/' + this.id, { withCredentials: true }).pipe(
            switchMap(matches => {
                const userObservables: Observable<User>[] = [];
                for (const match of matches) {
                    userObservables.push(this.authService.getUserInfosById(match).pipe(
                        map((response: GetUserResponseData) => {
                            const user: User = {
                                id: response.user.id,
                                username: response.user.username,
                                first_name: response.user.first_name,
                                last_name: response.user.last_name,
                                picture_1: 'data:image/jpeg;base64,' + response.user.picture_1,
                                status: 'Offline',
                                block: {
                                    id: -1,
                                    author_id: -1,
                                    blocked_user_id: -1,
                                    isBlocked: false
                                },
                                notificationCount: 0
                            };
                            return user;
                        })
                    ));
                }
                return forkJoin(userObservables).pipe(
                    map(users => users.filter(user => user !== null) as User[])
                );
            })
        );
    }

    sendMessage(message: string, recipient_id: number): Observable<any> {
        this.socketService.sendMessage(message, recipient_id);
        return this.http.post(this.url + '/messages/create', { message: message, author_id: this.id, recipient_id: recipient_id }, { withCredentials: true });
    }

    public getMessages(): Observable<any> {
        return this.socketService.getMessages();
    }

    public getAllUserStatusEvents(): Observable<any> {
        return this.socketService.getAllUserStatusEvents();
    }

    public getMessagesFromUser(recipient: User): Observable<Message[]> {
        return this.http.get<Message[]>(this.url + '/messages/' + this.id + "/" + recipient.id, { withCredentials: true });
    }

    public getStatus(recipient: User): Observable<any> {
        return this.socketService.getStatus(recipient);
    }

    public getCheckBlock(recipient: User): Observable<any> {
        return this.http.get(this.url + '/blocks/' + this.id + "/" + recipient.id, { withCredentials: true });
    }

    public handleDisconnect(): Observable<any> {
        return this.socketService.handleDisconnect();
    }

    public isUserBlocked(user: User): Observable<any> {
        return this.http.get(this.url + '/blocks/' + this.id + "/" + user.id, { withCredentials: true });
    }

    public blockUser(recipient: User): Observable<any> {
        return this.http.post(this.url + '/blocks/create/', { author_id: this.id, recipient_id: recipient.id }, { withCredentials: true });
    }

    public emitBlock(blockId: number, recipient: User) {
        this.socketService.blockUser(blockId, recipient);
    }

    public emitUnblock(blockId: number, recipient: User) {
        this.socketService.unblockUser(blockId, recipient);
    }

    public unblockUser(user: User): Observable<any> {
        return this.http.post(this.url + '/blocks/delete/', { id: user.block.id }, { withCredentials: true });
    }

    public handleBlock(): Observable<any> {
        return this.socketService.handleBlock();
    }

    public handleUnblock(): Observable<any> {
        return this.socketService.handleUnblock();
    }

    public reportUser(recipient: User): Observable<any> {
        return this.http.post(this.url + '/reports/create/', { author_id: this.id, recipient_id: recipient.id }, { withCredentials: true });
    }
}