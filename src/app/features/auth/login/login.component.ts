import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { AuthService } from '@shared/services/auth.service';
import { ToastNotificationService } from '@shared/services/toast-notification.service';
import type { ApiError } from '@shared/models/api.models';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        RippleModule,
        MessageModule
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);
    private readonly toastNotification = inject(ToastNotificationService);
    private readonly destroyRef = inject(DestroyRef);

    readonly errorMessage = signal<string | null>(null);
    readonly isLoading = this.authService.isLoading;
    readonly isUnverified = signal<boolean>(false);
    readonly unverifiedEmail = signal<string | null>(null);

    readonly loginForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(1)]]
    });

    constructor() {
        const pending = this.toastNotification.consume();
        if (pending) {
            this.messageService.add(pending);
        }

        const email = this.route.snapshot.queryParamMap.get('email');
        if (email) {
            this.loginForm.patchValue({ email });
            this.isUnverified.set(true);
            this.unverifiedEmail.set(email);
            this.errorMessage.set('Please verify your email before logging in.');
        }
    }

    onSubmit(): void {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.errorMessage.set(null);
        this.isUnverified.set(false);

        const { email, password } = this.loginForm.value;
        if (!email || !password) {
            return;
        }

        this.authService.login({ email, password }).subscribe({
            next: () => {
                let returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
                if (!returnUrl.startsWith('/') || returnUrl.startsWith('//')) {
                    returnUrl = '/';
                }
                void this.router.navigateByUrl(returnUrl);
            },
            error: (error: ApiError) => {
                if (error.code === 'EMAIL_NOT_VERIFIED') {
                    this.isUnverified.set(true);
                    this.unverifiedEmail.set(email);
                    this.errorMessage.set('Please verify your email before logging in.');
                } else {
                    this.errorMessage.set(error.message || 'Invalid email or password.');
                }
            }
        });
    }

    resendVerification(): void {
        const email = this.unverifiedEmail();
        if (!email) {
            return;
        }

        this.authService.resendVerification({ email }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Email Sent',
                    detail: 'We sent a new verification link to your email. Please check your inbox.'
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Failed to Send',
                    detail: 'Could not send verification email. Please try again.'
                });
            }
        });
    }
}
