import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SessionService } from './session.service';

describe('SessionService', () => {
    let service: SessionService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [SessionService]
        });
        service = TestBed.inject(SessionService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getSessions', () => {
        it('should fetch paginated sessions', () => {
            const mockSessions = {
                data: [
                    { id: 's1', isCurrent: true, userAgent: 'Chrome', ip: '1.1.1.1', expiresAt: '2024-02-01T00:00:00.000Z', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
                    { id: 's2', isCurrent: false, userAgent: 'Firefox', ip: '2.2.2.2', expiresAt: '2024-02-01T00:00:00.000Z', createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' }
                ],
                meta: { total: 2, page: 1, limit: 10, totalPages: 1 }
            };

            service.getSessions(1, 10).subscribe((res) => {
                expect(res.data.length).toBe(2);
                expect(res.meta.total).toBe(2);
            });

            const req = httpMock.expectOne((r) => r.url === 'http://localhost:3000/api/auth/sessions');
            expect(req.request.method).toBe('GET');
            expect(req.request.params.get('page')).toBe('1');
            expect(req.request.params.get('limit')).toBe('10');
            req.flush(mockSessions);
        });
    });

    describe('terminateSession', () => {
        it('should delete a session', () => {
            service.terminateSession('s1').subscribe();

            const req = httpMock.expectOne('http://localhost:3000/api/auth/sessions/s1');
            expect(req.request.method).toBe('DELETE');
            req.flush(null, { status: 204, statusText: 'No Content' });
        });
    });

    describe('terminateAllSessions', () => {
        it('should delete all other sessions', () => {
            service.terminateAllSessions().subscribe();

            const req = httpMock.expectOne('http://localhost:3000/api/auth/sessions');
            expect(req.request.method).toBe('DELETE');
            req.flush(null, { status: 204, statusText: 'No Content' });
        });
    });
});
