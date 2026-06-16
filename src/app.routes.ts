import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Notfound } from './app/demo/notfound/notfound';
import { authGuard, adminGuard } from './app/shared/guards/auth.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', loadComponent: () => import('./app/features/dashboard/dashboard').then(m => m.Dashboard) },
            { path: 'profile', loadComponent: () => import('./app/features/profile/profile.component').then(m => m.ProfileComponent) },
            {
                path: 'admin',
                canActivate: [adminGuard],
                loadChildren: () => import('./app/features/admin/admin.routes').then(m => m.adminRoutes)
            },
            { path: 'demo', loadChildren: () => import('./app/demo/demo.routes').then(m => m.default) }
        ]
    },
    { path: 'auth', loadChildren: () => import('./app/features/auth/auth.routes').then(m => m.authRoutes) },
    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: '/notfound' }
];
