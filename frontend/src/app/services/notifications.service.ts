import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import { Notification } from 'src/app/models/models';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  public displayNotifications$ = new BehaviorSubject<boolean>(false);
  public notificationsCount$ = new BehaviorSubject<number>(0);

  constructor() { }

  subscribeToNotifications(): Observable<Notification[]> {
    return this.notifications$;
  }

  getValues(): Notification[] {
    return this.notificationsSubject.getValue();
  }

  addNotification(notification: Notification) {
    const currentNotifications = this.notificationsSubject.getValue();
    currentNotifications.unshift(notification);
    this.notificationsSubject.next(currentNotifications);
    this.updateNotificationCount();
  }

  removeNotification(notification: Notification) {
    const currentNotifications = this.notificationsSubject.getValue();
    const index = currentNotifications.indexOf(notification);
    if (index !== -1) {
      currentNotifications.splice(index, 1);
      this.notificationsSubject.next(currentNotifications);
      this.updateNotificationCount();
    }
  }

  showNotifications() {
    this.displayNotifications$.next(true);
  }

  getNotificationCount(): Observable<number> {
    return this.notificationsCount$.asObservable();
  }

  getNotificationCountByAuthorId(authorId: number): Observable<number> {
    return this.notifications$.pipe(
      map((notifications) => {
        const count = notifications.filter(
          (notification) =>
            notification.author_id === authorId && notification.type === 'message'
        ).length;
        return count;
      })
    );
  }

  private updateNotificationCount() {
    const currentNotifications = this.notificationsSubject.value;
    const newCount = currentNotifications.length;
    this.notificationsCount$.next(newCount);
  }
}
