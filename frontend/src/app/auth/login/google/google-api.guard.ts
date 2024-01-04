import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from "@angular/router";

export const googleGuard: CanActivateFn = (
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot) => {
    const { id, username, firstName, lastName, emailVerified, avatar } = next.queryParams;
    if (!username || !firstName || !lastName || !emailVerified || !avatar || !id) {
        return false;
    }
    localStorage.setItem('id', id);
    localStorage.setItem('username', JSON.stringify(username));
    localStorage.setItem('firstName', JSON.stringify(firstName));
    localStorage.setItem('lastName', JSON.stringify(lastName));
    localStorage.setItem('email_checked', emailVerified);
    localStorage.setItem('avatar', JSON.stringify(avatar));
    localStorage.setItem('loginApi', '1');
    localStorage.setItem('language', JSON.stringify('en'));

    window.location.href = "/";
    return true;
}