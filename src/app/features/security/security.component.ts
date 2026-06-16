import { Component, DestroyRef, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { AuthService } from '@shared/services/auth.service';
import { SessionTableComponent } from './session-table/session-table.component';
import type { ApiError } from '@shared/models/api.models';

@Component({
    selector: 'app-security',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        CardModule,
        SessionTableComponent
    ],
    templateUrl: './security.component.html',
    styleUrl: './security.component.scss'
})
export class SecurityComponent {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(MessageService);
    private readonly destroyRef = inject(DestroyRef);

    @ViewChild('sessionTable') sessionTable!: SessionTableComponent;

    readonly isSaving = signal(false);

    readonly passwordForm = this.fb.group({
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]],
        confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    private passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
        const newPass = form.get('newPassword')?.value;
        const confirmPass = form.get('confirmPassword')?.value;
        return newPass && confirmPass && newPass !== confirmPass ? { passwordMismatch: true } : null;
    }

    onSubmit(): void {
        if (this.passwordForm.invalid) {
            this.passwordForm.markAllAsTouched();
            return;
        }

        const { currentPassword, newPassword } = this.passwordForm.value;
        if (!currentPassword || !newPassword) return;

        this.isSaving.set(true);
        this.authService.changePassword({ currentPassword, newPassword }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.passwordForm.reset();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Password Updated',
                    detail: 'Your password has been changed. All other sessions have been terminated.'
                });
                this.sessionTable.loadSessions(1);
            },
            error: (error: ApiError) => {
                this.isSaving.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Update Failed',
                    detail: error.message || 'Failed to change password. Please check your current password.'
                });
            }
        });
    }
}
