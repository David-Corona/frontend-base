import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@shared/services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    const returnUrl = state.url;
    void router.navigate(['/auth/login'], {
        queryParams: { returnUrl }
    });
    return false;
};

export const publicAuthGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        void router.navigate(['/']);
        return false;
    }

    return true;
};

export const adminGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasAnyPermission('users:read', 'roles:read')) {
        return true;
    }

    void router.navigate(['/']);
    return false;
};
