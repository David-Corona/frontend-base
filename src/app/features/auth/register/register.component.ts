import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { MessageModule } from 'primeng/message';
import { AuthService } from '@shared/services/auth.service';
import { ToastNotificationService } from '@shared/services/toast-notification.service';
import type { ApiError } from '@shared/models/api.models';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        RippleModule,
        MessageModule
    ],
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss'
})
export class RegisterComponent {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly toastNotification = inject(ToastNotificationService);
    private readonly destroyRef = inject(DestroyRef);

    readonly errorMessage = signal<string | null>(null);
    readonly isLoading = this.authService.isLoading;

    readonly registerForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    onSubmit(): void {
        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        this.errorMessage.set(null);

        const { email, password } = this.registerForm.value;
        if (!email || !password) {
            return;
        }

        this.authService.register({ email, password }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.toastNotification.set({
                    severity: 'success',
                    summary: 'Registration Successful',
                    detail: 'We sent a verification link to your email. Please check your inbox.'
                });
                void this.router.navigate(['/auth/login'], { queryParams: { email } });
            },
            error: (error: ApiError) => {
                this.errorMessage.set(error.message || 'Registration failed. Please try again.');
            }
        });
    }

    private passwordMatchValidator(form: ReturnType<typeof this.fb.group>): null | { passwordMismatch: true } {
        const password = form.get('password')?.value as string;
        const confirmPassword = form.get('confirmPassword')?.value as string;
        if (password && confirmPassword && password !== confirmPassword) {
            return { passwordMismatch: true };
        }
        return null;
    }
}
