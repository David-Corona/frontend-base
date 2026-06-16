import { Component, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { AuthService } from '@shared/services/auth.service';
import { UserService } from '@shared/services/user.service';
import { SessionTableComponent } from '@features/security/session-table/session-table.component';
import type { User } from '@shared/models/user.models';
import type { ApiError } from '@shared/models/api.models';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        CardModule,
        TagModule,
        SessionTableComponent
    ],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly userService = inject(UserService);
    private readonly messageService = inject(MessageService);
    private readonly destroyRef = inject(DestroyRef);

    @ViewChild('sessionTable') sessionTable!: SessionTableComponent;

    readonly isEditing = signal(false);
    readonly isSaving = signal(false);
    readonly isSavingPassword = signal(false);
    readonly currentUser = this.authService.currentUser;

    readonly profileForm = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(255)]]
    });

    readonly passwordForm = this.fb.group({
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]],
        confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    private originalName: string | null = null;

    private passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
        const newPass = form.get('newPassword')?.value;
        const confirmPass = form.get('confirmPassword')?.value;
        return newPass && confirmPass && newPass !== confirmPass ? { passwordMismatch: true } : null;
    }

    ngOnInit(): void {
        const user = this.currentUser();
        if (user) {
            this.profileForm.patchValue({ name: user.name ?? '' });
            this.originalName = user.name;
        }

        this.userService.getMe().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (user) => this.authService.updateUserInStorage(user),
            error: () => {}
        });
    }

    startEditing(): void {
        const user = this.currentUser();
        this.profileForm.patchValue({ name: user?.name ?? '' });
        this.originalName = user?.name ?? null;
        this.isEditing.set(true);
    }

    onCancel(): void {
        this.profileForm.patchValue({ name: this.originalName ?? '' });
        this.isEditing.set(false);
    }

    onSave(): void {
        const nameValue = this.profileForm.get('name')?.value?.trim();

        if (!nameValue) {
            this.profileForm.get('name')?.setErrors({ required: true });
            this.profileForm.markAllAsTouched();
            return;
        }

        if (this.profileForm.invalid) {
            this.profileForm.markAllAsTouched();
            return;
        }

        this.isSaving.set(true);
        this.userService.updateProfile({ name: nameValue }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (updatedUser) => {
                this.authService.updateUserInStorage(updatedUser);
                this.originalName = updatedUser.name;
                this.isEditing.set(false);
                this.isSaving.set(false);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Profile Updated',
                    detail: 'Your profile has been updated successfully.'
                });
            },
            error: (error: ApiError) => {
                this.isSaving.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Update Failed',
                    detail: error.message || 'Failed to update profile. Please try again.'
                });
            }
        });
    }

    onSubmitPassword(): void {
        if (this.passwordForm.invalid) {
            this.passwordForm.markAllAsTouched();
            return;
        }

        const { currentPassword, newPassword } = this.passwordForm.value;
        if (!currentPassword || !newPassword) return;

        this.isSavingPassword.set(true);
        this.authService.changePassword({ currentPassword, newPassword }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.isSavingPassword.set(false);
                this.passwordForm.reset();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Password Updated',
                    detail: 'Your password has been changed. All other sessions have been terminated.'
                });
                this.sessionTable.loadSessions(1);
            },
            error: (error: ApiError) => {
                this.isSavingPassword.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Update Failed',
                    detail: error.message || 'Failed to change password. Please check your current password.'
                });
            }
        });
    }
}
