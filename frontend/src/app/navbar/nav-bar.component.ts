import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LocalStorageService, localStorageName } from 'src/app/services/local-storage.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { MatMenuTrigger } from '@angular/material/menu';
import { Notification } from 'src/app/models/models';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss', '../app.component.scss'],
  animations: [
    trigger("slideInOut", [
      transition(":enter", [
        style({ transform: "translateX(-100%)" }),
        animate("100ms", style({ transform: "translateX(0)" }))
      ]),
      transition(":leave", [
        animate("100ms", style({ transform: "translateX(-100%)" }))
      ])
    ])
  ]
})
export class NavBarComponent implements OnInit {
  isLoggedIn: boolean | undefined;
  username = "";
  notifications: Notification[] = [];
  notificationCount: number = 0;
  sideNavOpened = false;

  @ViewChild(MatMenuTrigger) private menuTrigger!: MatMenuTrigger;
  constructor(
    private router: Router,
    private authService: AuthService,
    private localStorageService: LocalStorageService,
    protected notificationsService: NotificationsService
  ) {
    this.isLoggedIn = this.authService.checkLog();
    if (this.isLoggedIn) {
      this.username = this.localStorageService.getItem(localStorageName.username);
    }
    this.authService.isLoggedEmitter.subscribe(value => {
      this.isLoggedIn = value;
      if (this.isLoggedIn) {
        this.username = this.localStorageService.getItem(localStorageName.username);
      }
    });
  }
  ngOnInit(): void {
    this.authService.checkLogAndLogout();
    this.notificationsService.notifications$.subscribe((notifications) => {
      this.notifications = notifications;
    });
    this.notificationsService.notificationsCount$.subscribe((notifications) => {
      this.notificationCount = notifications;
    });
  }

  logOut() {
    this.authService.logout();
  }

  home() {
    this.router.navigate(['']);
  }

  profile() {
    this.router.navigate(['profile/' + this.localStorageService.getItem('username')]);
  }

  sideNavToggle() {
    this.sideNavOpened = !this.sideNavOpened;
  }
}
