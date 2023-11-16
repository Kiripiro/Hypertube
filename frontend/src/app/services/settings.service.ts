import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { LocalStorageService, localStorageName } from "./local-storage.service";
import { GetUserResponseData, LocationIQApiResponseData, UpdateLocationResponseData, UserSettings } from "src/app/models/models";
import { Observable, map, of, switchMap } from "rxjs";
import { AuthService } from "./auth.service";
import { environment } from "src/environments/environment.template";

@Injectable({
	providedIn: "root"
})
export class SettingsService {
	url: string;
	constructor(
		private localStorageService: LocalStorageService,
		private authService: AuthService,
		private http: HttpClient
	) {
		this.url = environment.backendUrl || "http://localhost:3000";
	}

	public getUser(): Observable<GetUserResponseData> {
		return this.http.get<GetUserResponseData>(this.url + `/users/id`, { withCredentials: true });
	}

	public updateUser(user: Partial<UserSettings>, files: string[] | null): Observable<any> {
		return this.http.post(this.url + `/users/settingsUpdate`, { user, files }, { withCredentials: true });
	}

	public deleteUser(): Observable<any> {
		return this.http.post(this.url + `/users/delete`, null, { withCredentials: true });
	}
}