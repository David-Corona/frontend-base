import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { of, throwError } from 'rxjs';
import { SessionTableComponent } from './session-table.component';
import { SessionService } from '@shared/services/session.service';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import type { Session } from '@shared/models/session.models';
import type { PaginatedResponse, ApiError } from '@shared/models/api.models';

const mockSession: Session = {
    id: 'session-1',
    userId: 'user-1',
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    createdAt: '2024-01-15T10:00:00.000Z',
    expiresAt: '2024-01-22T10:00:00.000Z',
    isCurrent: true
};

const mockSession2: Session = {
    id: 'session-2',
    userId: 'user-1',
    ip: '10.0.0.1',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    createdAt: '2024-01-14T10:00:00.000Z',
    expiresAt: '2024-01-21T10:00:00.000Z',
    isCurrent: false
};

const mockSessionsResponse: PaginatedResponse<Session> = {
    data: [mockSession, mockSession2],
    meta: { total: 2, page: 1, limit: 10, totalPages: 1 }
};

describe('SessionTableComponent', () => {
    let component: SessionTableComponent;
    let fixture: ComponentFixture<SessionTableComponent>;
    let sessionServiceMock: {
        getSessions: jest.Mock;
        terminateSession: jest.Mock;
        terminateAllSessions: jest.Mock;
    };
    let messageServiceMock: { add: jest.Mock };
    let confirmationService: ConfirmationService;

    beforeEach(() => {
        sessionServiceMock = {
            getSessions: jest.fn().mockReturnValue(of(mockSessionsResponse)),
            terminateSession: jest.fn(),
            terminateAllSessions: jest.fn()
        };
        messageServiceMock = { add: jest.fn() };

        TestBed.configureTestingModule({
            imports: [
                TableModule,
                ButtonModule,
                TagModule,
                ConfirmDialogModule,
                TooltipModule
            ],
            providers: [
                { provide: SessionService, useValue: sessionServiceMock },
                { provide: MessageService, useValue: messageServiceMock },
                ConfirmationService
            ]
        }).overrideComponent(SessionTableComponent, {
            set: {
                imports: [
                    CommonModule,
                    TableModule,
                    ButtonModule,
                    TagModule,
                    ConfirmDialogModule,
                    TooltipModule
                ],
                providers: [
                    ConfirmationService
                ]
            }
        });

        fixture = TestBed.createComponent(SessionTableComponent);
        component = fixture.componentInstance;
        confirmationService = fixture.debugElement.injector.get(ConfirmationService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load sessions on init', () => {
        expect(sessionServiceMock.getSessions).toHaveBeenCalledWith(1, 10);
        expect(component.sessions().length).toBe(2);
        expect(component.totalRecords()).toBe(2);
    });

    it('should display browser name for Chrome', () => {
        const browserName = component.getBrowserName(mockSession.userAgent);
        expect(browserName).toBe('Chrome');
    });

    it('should display browser name for Safari', () => {
        const browserName = component.getBrowserName(mockSession2.userAgent);
        expect(browserName).toBe('Safari');
    });

    it('should display OS name for Windows', () => {
        const osName = component.getOsName(mockSession.userAgent);
        expect(osName).toBe('Windows 10+');
    });

    it('should display OS name for macOS', () => {
        const osName = component.getOsName(mockSession2.userAgent);
        expect(osName).toBe('macOS');
    });

    it('should return correct browser icon', () => {
        expect(component.getBrowserIcon(mockSession.userAgent)).toBe('pi-chrome');
        expect(component.getBrowserIcon(mockSession2.userAgent)).toBe('pi-apple');
    });

    it('should handle null user agent', () => {
        expect(component.getBrowserName(null)).toBe('Unknown');
        expect(component.getOsName(null)).toBe('Unknown');
        expect(component.getBrowserIcon(null)).toBe('pi-globe');
    });

    it('should calculate pages correctly', () => {
        component.totalRecords.set(25);
        component.pageSize.set(10);
        expect(component.getPages()).toEqual([1, 2, 3]);
    });

    it('should load sessions for specific page', () => {
        component.goToPage(2);
        expect(sessionServiceMock.getSessions).toHaveBeenCalledWith(2, 10);
    });

    it('should show error toast on failed session load', () => {
        sessionServiceMock.getSessions.mockReturnValue(throwError(() => new Error('Failed')));

        component.loadSessions();

        expect(messageServiceMock.add).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load sessions.'
        });
    });

    it('should confirm terminate session', () => {
        const confirmSpy = jest.spyOn(confirmationService, 'confirm');
        component.confirmTerminate(mockSession);

        expect(confirmSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Are you sure you want to terminate this session?',
                header: 'Terminate Session'
            })
        );
    });

    it('should terminate session on confirm', () => {
        sessionServiceMock.terminateSession.mockReturnValue(of(void 0));
        jest.spyOn(confirmationService, 'confirm').mockImplementation((config: any) => {
            config.accept();
            return {} as any;
        });

        component.confirmTerminate(mockSession);

        expect(sessionServiceMock.terminateSession).toHaveBeenCalledWith('session-1');
    });

    it('should show success toast after session termination', () => {
        sessionServiceMock.terminateSession.mockReturnValue(of(void 0));
        jest.spyOn(confirmationService, 'confirm').mockImplementation((config: any) => {
            config.accept();
            return {} as any;
        });

        component.confirmTerminate(mockSession);

        expect(messageServiceMock.add).toHaveBeenCalledWith({
            severity: 'success',
            summary: 'Session Terminated',
            detail: 'The session has been terminated successfully.'
        });
    });

    it('should confirm terminate all sessions', () => {
        const confirmSpy = jest.spyOn(confirmationService, 'confirm');
        component.confirmTerminateAll();

        expect(confirmSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining('terminate all other active sessions'),
                header: 'Terminate All Other Sessions'
            })
        );
    });

    it('should terminate all sessions on confirm', () => {
        sessionServiceMock.terminateAllSessions.mockReturnValue(of(void 0));
        jest.spyOn(confirmationService, 'confirm').mockImplementation((config: any) => {
            config.accept();
            return {} as any;
        });

        component.confirmTerminateAll();

        expect(sessionServiceMock.terminateAllSessions).toHaveBeenCalled();
    });
});
