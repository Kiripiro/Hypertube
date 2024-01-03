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
		return this.http.get<GetUserResponseData>(this.url + `/user/id`, { withCredentials: true });
	}

	public updateUser(user: Partial<UserSettings>, file: string | null): Observable<any> {
		return this.http.post<UserSettings>(this.url + `/user/settingsUpdate`, { user, file }, { withCredentials: true });
	}

	public deleteUser(id: Number): Observable<any> {
		return this.http.post(this.url + `/user/delete`, {userId: id}, { withCredentials: true });
	}
}