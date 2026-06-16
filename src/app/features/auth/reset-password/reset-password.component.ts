import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { MessageModule } from 'primeng/message';
import { AuthService } from '@shared/services/auth.service';
import type { ApiError } from '@shared/models/api.models';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        PasswordModule,
        RippleModule,
        MessageModule
    ],
    templateUrl: './reset-password.component.html',
    styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly route = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);

    readonly errorMessage = signal<string | null>(null);
    readonly isSubmitted = signal<boolean>(false);
    readonly isLoading = this.authService.isLoading;
    readonly token = signal<string | null>(null);

    readonly resetPasswordForm = this.fb.group({
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    ngOnInit(): void {
        const token = this.route.snapshot.queryParamMap.get('token');
        this.token.set(token);
    }

    onSubmit(): void {
        if (this.resetPasswordForm.invalid) {
            this.resetPasswordForm.markAllAsTouched();
            return;
        }

        this.errorMessage.set(null);

        const token = this.token();
        const { password } = this.resetPasswordForm.value;
        if (!token || !password) {
            return;
        }

        this.authService.resetPassword({ token, newPassword: password }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.isSubmitted.set(true);
            },
            error: (error: ApiError) => {
                this.errorMessage.set(error.message || 'Could not reset password. Please try again.');
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
