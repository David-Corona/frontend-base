import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RoleService } from './role.service';

describe('RoleService', () => {
    let service: RoleService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [RoleService]
        });
        service = TestBed.inject(RoleService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getRoles', () => {
        it('should fetch paginated roles', () => {
            const mockRoles = {
                data: [{ id: '1', name: 'admin', description: null, permissions: ['users:read'], createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' }],
                meta: { total: 1, page: 1, limit: 100, totalPages: 1 }
            };

            service.getRoles(1, 100).subscribe((res) => {
                expect(res.data.length).toBe(1);
                expect(res.data[0].name).toBe('admin');
            });

            const req = httpMock.expectOne((r) => r.url === 'http://localhost:3000/api/roles');
            expect(req.request.method).toBe('GET');
            expect(req.request.params.get('page')).toBe('1');
            expect(req.request.params.get('limit')).toBe('100');
            req.flush(mockRoles);
        });
    });
});
