import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SessionService } from '@shared/services/session.service';
import type { Session } from '@shared/models/session.models';
import type { PaginatedResponse, ApiError } from '@shared/models/api.models';

interface ParsedUserAgent {
    browser: string;
    os: string;
}

const userAgentCache = new Map<string, ParsedUserAgent>();

function parseUserAgent(ua: string | null): ParsedUserAgent {
    if (!ua) return { browser: 'Unknown', os: 'Unknown' };

    const cached = userAgentCache.get(ua);
    if (cached) return cached;

    let browser = 'Unknown';
    if (ua.includes('Firefox/')) browser = 'Firefox';
    else if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome/')) browser = 'Chrome';
    else if (ua.includes('Safari/')) browser = 'Safari';
    else if (ua.includes('Opera/') || ua.includes('OPR/')) browser = 'Opera';

    let os = 'Unknown';
    if (ua.includes('Windows NT 10')) os = 'Windows 10+';
    else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
    else if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS X')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    const result = { browser, os };
    userAgentCache.set(ua, result);
    return result;
}

@Component({
    selector: 'app-session-table',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        TagModule,
        ConfirmDialogModule,
        TooltipModule
    ],
    providers: [ConfirmationService],
    templateUrl: './session-table.component.html',
    styleUrl: './session-table.component.scss'
})
export class SessionTableComponent implements OnInit {
    private readonly sessionService = inject(SessionService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);
    private readonly destroyRef = inject(DestroyRef);

    readonly Math = Math;

    readonly sessions = signal<Session[]>([]);
    readonly isLoading = signal(false);
    readonly totalRecords = signal(0);
    readonly currentPage = signal(1);
    readonly pageSize = signal(10);

    ngOnInit(): void {
        this.loadSessions();
    }

    loadSessions(page = 1): void {
        this.isLoading.set(true);
        this.sessionService.getSessions(page, this.pageSize()).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (response) => {
                this.sessions.set(response.data);
                this.totalRecords.set(response.meta.total);
                this.currentPage.set(response.meta.page);
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load sessions.'
                });
            }
        });
    }

    confirmTerminate(session: Session): void {
        this.confirmationService.confirm({
            message: 'Are you sure you want to terminate this session?',
            header: 'Terminate Session',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.doTerminate(session);
            }
        });
    }

    confirmTerminateAll(): void {
        this.confirmationService.confirm({
            message: 'This will terminate all other active sessions. You will remain signed in on this device.',
            header: 'Terminate All Other Sessions',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.doTerminateAll();
            }
        });
    }

    private doTerminate(session: Session): void {
        this.sessionService.terminateSession(session.id).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Session Terminated',
                    detail: 'The session has been terminated successfully.'
                });
                this.loadSessions(this.currentPage());
            },
            error: (error: ApiError) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Failed',
                    detail: error.message || 'Failed to terminate session.'
                });
            }
        });
    }

    private doTerminateAll(): void {
        this.sessionService.terminateAllSessions().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Sessions Terminated',
                    detail: 'All other sessions have been terminated.'
                });
                this.loadSessions(1);
            },
            error: (error: ApiError) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Failed',
                    detail: error.message || 'Failed to terminate sessions.'
                });
            }
        });
    }

    getBrowserIcon(ua: string | null): string {
        const { browser } = parseUserAgent(ua);
        switch (browser) {
            case 'Chrome': return 'pi-chrome';
            case 'Firefox': return 'pi-fire';
            case 'Edge': return 'pi-at';
            case 'Safari': return 'pi-apple';
            case 'Opera': return 'pi-compass';
            default: return 'pi-globe';
        }
    }

    getBrowserName(ua: string | null): string {
        return parseUserAgent(ua).browser;
    }

    getOsName(ua: string | null): string {
        return parseUserAgent(ua).os;
    }

    getPages(): number[] {
        const total = Math.ceil(this.totalRecords() / this.pageSize());
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    goToPage(page: number): void {
        this.loadSessions(page);
    }
}
