import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { MessageModule } from 'primeng/message';
import { AuthService } from '@shared/services/auth.service';
import type { ApiError } from '@shared/models/api.models';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        RippleModule,
        MessageModule
    ],
    templateUrl: './forgot-password.component.html',
    styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly destroyRef = inject(DestroyRef);

    readonly errorMessage = signal<string | null>(null);
    readonly isSubmitted = signal<boolean>(false);
    readonly isLoading = this.authService.isLoading;

    readonly forgotPasswordForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]]
    });

    onSubmit(): void {
        if (this.forgotPasswordForm.invalid) {
            this.forgotPasswordForm.markAllAsTouched();
            return;
        }

        this.errorMessage.set(null);

        const { email } = this.forgotPasswordForm.value;
        if (!email) {
            return;
        }

        this.authService.forgotPassword({ email }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.isSubmitted.set(true);
            },
            error: (error: ApiError) => {
                this.errorMessage.set(error.message || 'Could not send reset link. Please try again.');
            }
        });
    }
}
