import { Component, OnInit } from '@angular/core';
import { LocalStorageService, localStorageName } from '../services/local-storage.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { RelationService } from 'src/app/services/relation.service';
import { ElementListData, User } from 'src/app/models/models';
import { DialogService } from 'src/app/services/dialog.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss', '../app.component.scss']
})
export class ProfileComponent implements OnInit {

  username = "";
  userInfos: any;
  loading = true;
  error = false;
  personalProfil = false;
  private id: number;

  constructor(
    private localStorageService: LocalStorageService,
    private authService: AuthService,
    private relationService: RelationService,
    private dialogService: DialogService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.id = this.localStorageService.getItem(localStorageName.id);
    if (!this.authService.checkLog()) {
      this.router.navigate(['auth/login']);
      return;
    }
    this.loading = true;
    this.error = false;
    this.route.params.subscribe(params => {
      this.username = params['username'];
      if (this.username == "") {
        this.error = true;
      }
      this.authService.getUserInfos(this.username).subscribe({
        next: (response) => {
          console.log(response);
          this.userInfos = response.user;
          console.log(this.userInfos);
          this.personalProfil = this.userInfos.id == this.id;
          if (this.userInfos.avatar && this.userInfos.avatar.includes("http") || this.userInfos.avatar.includes("https")) {
            this.userInfos.avatar = this.userInfos.avatar;
          } else {
            this.userInfos.avatar = "data:image/png;base64," + this.userInfos.avatar;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error(error);
        }
      });
    });
  }

  ngOnInit(): void {
    if (!this.authService.checkLog()) {
      this.router.navigate(['auth/login']);
      return;
    }
  }
}
