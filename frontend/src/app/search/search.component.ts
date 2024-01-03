import { Component, OnInit } from '@angular/core';
import { LocalStorageService, localStorageName } from '../services/local-storage.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { HomeService } from 'src/app/services/home.service';
import { GetUserResponseData } from 'src/app/models/models';
import { SearchService } from 'src/app/services/search.service';
import { FormControl } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss', '../app.component.scss']
})
export class SearchComponent implements OnInit {
  control = new FormControl();
  search: string = '';
  usernames: string[] = [];
  filteredUsernames!: Observable<string[]>;

  constructor(
    private authService: AuthService,
    private searchService: SearchService,
    private router: Router,
    private localStorageService: LocalStorageService,
    private homeService: HomeService
  ) {
    if (!this.authService.checkLog()) {
      this.router.navigate(['auth/login']);
      return;
    }
    this.filteredUsernames = this.control.valueChanges.pipe(
      startWith(''),
      map(username => (username ? this._filterUsernames(username) : this.usernames.slice())),
    );
  }

  ngOnInit(): void {
    this.searchService.getAllUsernames().subscribe({
      next: (response: any) => {
        if (response && response.usernames && Array.isArray(response.usernames)) {
          this.usernames = response.usernames;
        } else {
          console.error('Invalid response format:', response);
        }
      }, error: (error) => {
      }
    });
  }

  goToProfile(username: string) {
    this.router.navigate(['profile', username]);
  }

  _filterUsernames(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.usernames.filter(username => username.toLowerCase().includes(filterValue));
  }
}
