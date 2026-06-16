import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { AuthService } from '@shared/services/auth.service';
import { UserService } from '@shared/services/user.service';
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
        CardModule,
        TagModule
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

    readonly isEditing = signal(false);
    readonly isSaving = signal(false);
    readonly currentUser = this.authService.currentUser;

    readonly profileForm = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(255)]]
    });

    private originalName: string | null = null;

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
}
