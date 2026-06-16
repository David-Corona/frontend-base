import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UserService } from '@shared/services/user.service';
import type { User } from '@shared/models/user.models';
import type { ApiError } from '@shared/models/api.models';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        TagModule,
        ConfirmDialogModule,
        TooltipModule
    ],
    providers: [ConfirmationService],
    templateUrl: './user-list.component.html',
    styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit {
    private readonly userService = inject(UserService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    readonly users = signal<User[]>([]);
    readonly isLoading = signal(false);
    readonly totalRecords = signal(0);
    readonly currentPage = signal(1);
    readonly pageSize = signal(25);

    statusFilter: string | null = 'active';
    nameFilter = '';
    emailFilter = '';

    readonly statusOptions = [
        { label: 'All', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' }
    ];

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(page = 1): void {
        this.isLoading.set(true);
        this.userService.getUsers({
            page,
            limit: this.pageSize(),
            status: (this.statusFilter as 'active' | 'inactive' | 'all') || 'all',
            name: this.nameFilter || undefined,
            email: this.emailFilter || undefined
        }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (response) => {
                this.users.set(response.data);
                this.totalRecords.set(response.meta.total);
                this.currentPage.set(response.meta.page);
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load users.'
                });
            }
        });
    }

    onPage(event: TableLazyLoadEvent): void {
        const page = (event.first ?? 0) / (event.rows ?? 25) + 1;
        const newSize = event.rows ?? 25;
        if (newSize !== this.pageSize()) {
            this.pageSize.set(newSize);
        }
        this.loadUsers(page);
    }

    clearFilters(): void {
        this.statusFilter = 'all';
        this.nameFilter = '';
        this.emailFilter = '';
        this.loadUsers(1);
    }

    viewUser(user: User): void {
        void this.router.navigate(['/admin/users', user.id]);
    }

    confirmDeactivate(user: User): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to deactivate ${user.email}?`,
            header: 'Deactivate User',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.doDeactivate(user);
            }
        });
    }

    confirmActivate(user: User): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to activate ${user.email}?`,
            header: 'Activate User',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.doActivate(user);
            }
        });
    }

    private doDeactivate(user: User): void {
        this.userService.deactivateUser(user.id).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'User Deactivated',
                    detail: `${user.email} has been deactivated.`
                });
                this.loadUsers(this.currentPage());
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
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'User Activated',
                    detail: `${user.email} has been activated.`
                });
                this.loadUsers(this.currentPage());
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
}
