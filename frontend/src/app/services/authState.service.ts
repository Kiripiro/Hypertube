import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class AuthStateService {
    code: string | null = null;
}