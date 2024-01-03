import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from "@angular/router";

export const googleGuard: CanActivateFn = (
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot) => {
    const { id, username, firstName, lastName, emailVerified, avatar } = next.queryParams;
    console.log(next.queryParams);
    if (!username || !firstName || !lastName || !emailVerified || !avatar || !id) {
        console.log('error');
        return false;
    }
    console.log(typeof username);
    console.log(typeof firstName);
    localStorage.setItem('id', id);
    localStorage.setItem('username', JSON.stringify(username));
    localStorage.setItem('firstName', JSON.stringify(firstName));
    localStorage.setItem('lastName', JSON.stringify(lastName));
    localStorage.setItem('email_checked', emailVerified);
    localStorage.setItem('avatar', JSON.stringify(avatar));
    localStorage.setItem('loginApi', '1');
    localStorage.setItem('language', JSON.stringify('en'));

    return true;
}