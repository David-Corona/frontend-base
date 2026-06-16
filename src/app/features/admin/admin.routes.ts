import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
    { path: '', redirectTo: 'users', pathMatch: 'full' },
    {
        path: 'users',
        loadComponent: () => import('./user-list/user-list.component').then(m => m.UserListComponent)
    },
    {
        path: 'users/:id',
        loadComponent: () => import('./user-detail/user-detail.component').then(m => m.UserDetailComponent)
    }
];
