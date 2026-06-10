import { Routes } from '@angular/router';
import { DemoDashboard } from './dashboard/dashboard';
import { Landing } from './landing/landing';
import { Crud } from './crud/crud';
import { Notfound } from './notfound/notfound';

export default [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DemoDashboard },
    { path: 'landing', component: Landing },
    { path: 'uikit', loadChildren: () => import('./uikit/uikit.routes').then(m => m.default) },
    { path: 'pages', loadChildren: () => import('./pages.routes').then(m => m.default) },
    { path: 'auth', loadChildren: () => import('./auth/auth.routes').then(m => m.default) },
    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
