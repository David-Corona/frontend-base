import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
    let httpClient: HttpClient;
    let httpMock: HttpTestingController;
    let messageService: MessageService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([errorInterceptor])),
                provideHttpClientTesting(),
                MessageService
            ]
        });

        httpClient = TestBed.inject(HttpClient);
        httpMock = TestBed.inject(HttpTestingController);
        messageService = TestBed.inject(MessageService);
        jest.spyOn(messageService, 'add');
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should normalize API error response', () => {
        httpClient.get('/api/test').subscribe({
            error: (error) => {
                expect(error.statusCode).toBe(400);
                expect(error.code).toBe('VALIDATION_ERROR');
                expect(error.message).toBe('Invalid input');
            }
        });

        const req = httpMock.expectOne('/api/test');
        req.flush(
            { statusCode: 400, error: 'Bad Request', message: 'Invalid input', code: 'VALIDATION_ERROR' },
            { status: 400, statusText: 'Bad Request' }
        );
    });

    it('should normalize 401 errors without showing toast', () => {
        httpClient.get('/api/test').subscribe({
            error: (error) => {
                expect(error.statusCode).toBe(401);
                expect(error.code).toBe('HTTP_EXCEPTION');
                expect(error.message).toBe('Unauthorized');
            }
        });

        const req = httpMock.expectOne('/api/test');
        req.flush({}, { status: 401, statusText: 'Unauthorized' });

        expect(messageService.add).not.toHaveBeenCalled();
    });

    it('should show toast for 5xx errors', () => {
        httpClient.get('/api/test').subscribe({
            error: (error) => {
                expect(error.statusCode).toBe(500);
            }
        });

        const req = httpMock.expectOne('/api/test');
        req.flush(
            { statusCode: 500, error: 'Internal Server Error', message: 'Something went wrong', code: 'INTERNAL_SERVER_ERROR' },
            { status: 500, statusText: 'Internal Server Error' }
        );

        expect(messageService.add).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Server Error',
            detail: 'Something went wrong'
        });
    });

    it('should generate fallback error for non-API errors', () => {
        httpClient.get('/api/test').subscribe({
            error: (error) => {
                expect(error.statusCode).toBe(404);
                expect(error.code).toBe('HTTP_EXCEPTION');
            }
        });

        const req = httpMock.expectOne('/api/test');
        req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should generate clean message for network errors (status 0)', () => {
        httpClient.get('/api/test').subscribe({
            error: (error) => {
                expect(error.statusCode).toBe(0);
                expect(error.code).toBe('NETWORK_ERROR');
                expect(error.message).toBe('Unable to connect to the server. Please check your internet connection and try again.');
            }
        });

        const req = httpMock.expectOne('/api/test');
        req.error(new ErrorEvent('error'), { status: 0, statusText: '' });
    });
});
