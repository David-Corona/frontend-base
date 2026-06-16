import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '@shared/services/auth.service';
import { UserService } from '@shared/services/user.service';
import { RoleService } from '@shared/services/role.service';
import type { User } from '@shared/models/user.models';
import type { Role } from '@shared/models/role.models';
import type { ApiError } from '@shared/models/api.models';

@Component({
    selector: 'app-user-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        CardModule,
        TagModule,
        SelectModule,
        ConfirmDialogModule
    ],
    providers: [ConfirmationService],
    templateUrl: './user-detail.component.html',
    styleUrl: './user-detail.component.scss'
})
export class UserDetailComponent implements OnInit {
    private readonly authService = inject(AuthService);
    private readonly userService = inject(UserService);
    private readonly roleService = inject(RoleService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);
    private readonly destroyRef = inject(DestroyRef);

    readonly user = signal<User | null>(null);
    readonly roles = signal<Role[]>([]);
    readonly isLoading = signal(true);
    readonly isEditingName = signal(false);
    readonly isSavingName = signal(false);
    readonly isAssigningRole = signal(false);

    selectedRoleId: string | null = null;

    readonly nameForm = this.fb.group({
        name: ['', [Validators.maxLength(255)]]
    });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            void this.router.navigate(['/admin/users']);
            return;
        }

        this.loadUser(id);
        this.loadRoles();
    }

    private loadUser(id: string): void {
        this.isLoading.set(true);
        this.userService.getUser(id).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (user) => {
                this.user.set(user);
                this.selectedRoleId = user.role.id;
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load user.'
                });
                void this.router.navigate(['/admin/users']);
            }
        });
    }

    private loadRoles(): void {
        this.roleService.getRoles(1, 100).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (response) => {
                this.roles.set(response.data);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load roles.'
                });
            }
        });
    }

    hasRolesPermission(): boolean {
        return this.authService.hasPermission('users:assign-role');
    }

    hasDeletePermission(): boolean {
        return this.authService.hasPermission('users:delete');
    }

    startEditName(): void {
        this.nameForm.patchValue({ name: this.user()?.name ?? '' });
        this.isEditingName.set(true);
    }

    cancelEditName(): void {
        this.isEditingName.set(false);
    }

    saveName(): void {
        if (this.nameForm.invalid) {
            this.nameForm.markAllAsTouched();
            return;
        }

        const userId = this.user()?.id;
        if (!userId) return;

        const raw = this.nameForm.get('name')?.value?.trim();
        const nameValue = raw === '' ? null : raw;

        this.isSavingName.set(true);
        this.userService.updateUser(userId, { name: nameValue }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (updatedUser) => {
                this.user.set(updatedUser);
                this.isEditingName.set(false);
                this.isSavingName.set(false);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Name Updated',
                    detail: 'The user name has been updated.'
                });
            },
            error: (error: ApiError) => {
                this.isSavingName.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Failed',
                    detail: error.message || 'Failed to update name.'
                });
            }
        });
    }

    assignRole(): void {
        const userId = this.user()?.id;
        if (!userId || !this.selectedRoleId) return;

        this.isAssigningRole.set(true);
        this.userService.assignRole(userId, this.selectedRoleId).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (updatedUser) => {
                this.user.set(updatedUser);
                this.isAssigningRole.set(false);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Role Assigned',
                    detail: `Role has been changed to ${updatedUser.role.name}.`
                });
            },
            error: (error: ApiError) => {
                this.isAssigningRole.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Failed',
                    detail: error.message || 'Failed to assign role.'
                });
            }
        });
    }

    confirmDeactivate(): void {
        const u = this.user();
        if (!u) return;

        this.confirmationService.confirm({
            message: `Are you sure you want to deactivate ${u.email}?`,
            header: 'Deactivate User',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.doDeactivate(u);
            }
        });
    }

    confirmActivate(): void {
        const u = this.user();
        if (!u) return;

        this.confirmationService.confirm({
            message: `Are you sure you want to activate ${u.email}?`,
            header: 'Activate User',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.doActivate(u);
            }
        });
    }

    private doDeactivate(user: User): void {
        this.userService.deactivateUser(user.id).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.user.set({ ...user, isActive: false });
                this.messageService.add({
                    severity: 'success',
                    summary: 'User Deactivated',
                    detail: `${user.email} has been deactivated.`
                });
            },
            error: (error: ApiError) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Failed',
                    detail: error.message || 'Failed to deactivate user.'
                });
            }
        });
    }

    private doActivate(user: User): void {
        this.userService.activateUser(user.id).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (updatedUser) => {
                this.user.set(updatedUser);
                this.messageService.add({
                    severity: 'success',
                    summary: 'User Activated',
                    detail: `${user.email} has been activated.`
                });
            },
            error: (error: ApiError) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Failed',
                    detail: error.message || 'Failed to activate user.'
                });
            }
        });
    }

    goBack(): void {
        void this.router.navigate(['/admin/users']);
    }
}
