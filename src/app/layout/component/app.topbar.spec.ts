import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MenuModule } from 'primeng/menu';
import { AppTopbar } from './app.topbar';
import { LayoutService } from '@/app/layout/service/layout.service';
import { AuthService } from '@shared/services/auth.service';

describe('AppTopbar', () => {
    let component: AppTopbar;
    let fixture: ComponentFixture<AppTopbar>;
    let authServiceMock: { logout: jest.Mock; isAuthenticated: jest.Mock };
    let routerNavigateSpy: jest.SpyInstance;
    let layoutService: LayoutService;

    beforeEach(() => {
        authServiceMock = {
            logout: jest.fn().mockReturnValue(of(void 0)),
            isAuthenticated: jest.fn().mockReturnValue(true)
        };

        TestBed.configureTestingModule({
            imports: [AppTopbar, MenuModule],
            providers: [
                provideRouter([{ path: 'auth/login', component: AppTopbar }]),
                { provide: AuthService, useValue: authServiceMock },
                LayoutService
            ]
        });

        fixture = TestBed.createComponent(AppTopbar);
        component = fixture.componentInstance;
        layoutService = TestBed.inject(LayoutService);
        routerNavigateSpy = jest.spyOn(TestBed.inject(Router), 'navigate');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render user button', () => {
        fixture.detectChanges();
        const userButton = fixture.nativeElement.querySelector('button:has(.pi-user)');
        expect(userButton).toBeTruthy();
    });

    it('should have a logout menu item', () => {
        expect(component.userMenuItems).toHaveLength(1);
        expect(component.userMenuItems[0].label).toBe('Logout');
        expect(component.userMenuItems[0].icon).toBe('pi pi-sign-out');
    });

    it('should call authService.logout() when logout command is triggered', () => {
        component.userMenuItems[0].command?.({} as any);
        expect(authServiceMock.logout).toHaveBeenCalled();
    });

    it('should navigate to /auth/login after logout', () => {
        component.userMenuItems[0].command?.({} as any);
        expect(routerNavigateSpy).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should navigate to /auth/login even when logout fails', () => {
        authServiceMock.logout.mockReturnValue(throwError(() => new Error('network error')));
        component.userMenuItems[0].command?.({} as any);
        expect(routerNavigateSpy).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should toggle dark mode', () => {
        const initialDarkMode = layoutService.layoutConfig().darkTheme;
        component.toggleDarkMode();
        expect(layoutService.layoutConfig().darkTheme).toBe(!initialDarkMode);
    });
});
