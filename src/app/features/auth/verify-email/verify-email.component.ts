import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService } from '@shared/services/auth.service';
import { ToastNotificationService } from '@shared/services/toast-notification.service';

@Component({
    selector: 'app-verify-email',
    standalone: true,
    imports: [
        RouterModule,
        ProgressSpinnerModule
    ],
    templateUrl: './verify-email.component.html',
    styleUrl: './verify-email.component.scss'
})
export class VerifyEmailComponent implements OnInit {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly toastNotification = inject(ToastNotificationService);

    ngOnInit(): void {
        const token = this.route.snapshot.queryParamMap.get('token');

        if (!token) {
            void this.router.navigate(['/auth/login']);
            return;
        }

        this.authService.verifyEmail({ token }).subscribe({
            next: () => {
                this.toastNotification.set({
                    severity: 'success',
                    summary: 'Email Verified',
                    detail: 'Your email has been verified. Please sign in.'
                });
                void this.router.navigate(['/auth/login']);
            },
            error: (error) => {
                if (error.code === 'EMAIL_ALREADY_VERIFIED') {
                    this.toastNotification.set({
                        severity: 'success',
                        summary: 'Email Verified',
                        detail: 'Your email has been verified. Please sign in.'
                    });
                    void this.router.navigate(['/auth/login']);
                } else if (error.code === 'TOKEN_EXPIRED') {
                    this.toastNotification.set({
                        severity: 'error',
                        summary: 'Link Expired',
                        detail: 'This verification link has expired. Please request a new one.'
                    });
                    void this.router.navigate(['/auth/login']);
                } else {
                    this.toastNotification.set({
                        severity: 'error',
                        summary: 'Verification Failed',
                        detail: 'Could not verify your email. Please try again.'
                    });
                    void this.router.navigate(['/auth/login']);
                }
            }
        });
    }
}
