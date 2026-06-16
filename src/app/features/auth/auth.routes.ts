import { Routes } from '@angular/router';
import { publicAuthGuard } from '@shared/guards/auth.guard';

export const authRoutes: Routes = [
    {
        path: 'login',
        canActivate: [publicAuthGuard],
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        canActivate: [publicAuthGuard],
        loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: 'verify-email',
        canActivate: [publicAuthGuard],
        loadComponent: () => import('./verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
    },
    {
        path: 'forgot-password',
        canActivate: [publicAuthGuard],
        loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
    },
    {
        path: 'reset-password',
        canActivate: [publicAuthGuard],
        loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
    }
];
