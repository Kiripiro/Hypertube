import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { LocalStorageService } from "./local-storage.service";
import { Observable } from "rxjs";
import { Tag } from "src/app/models/models";
import { environment } from "src/environments/environment.template";

@Injectable({
    providedIn: "root"
})
export class TagsService {
    url: string;
    availableTags: string[] = [
        "Sport",
        "Music",
        "Cinema",
        "Travel",
        "Art",
        "Politics",
        "Technology",
        "Cooking",
        "Fashion",
    ];
    selectedTags: string[] = [];

    constructor(
        private http: HttpClient,
        private localStorageService: LocalStorageService
    ) {
        this.url = environment.backendUrl || "http://localhost:3000";
    }

    public getTags(): string[] {
        return this.availableTags;
    }

    public getSelectedTags(): Observable<Tag[]> {
        return this.http.get<Tag[]>(this.url + "/tags/user/" + this.localStorageService.getItem("id"), { withCredentials: true });
    }

    addTag(tag: string) {
        const index = this.availableTags.indexOf(tag);
        this.availableTags.splice(index, 1);
        this.selectedTags.push(tag);
    }

    removeTag(tag: string) {
        const index = this.selectedTags.indexOf(tag);
        this.selectedTags.splice(index, 1);
        this.availableTags.push(tag);
    }
}