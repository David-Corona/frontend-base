import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import type { User } from '@shared/models/user.models';

const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    isActive: true,
    isVerified: true,
    role: { id: '1', name: 'user' },
    permissions: ['users:read'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
};

describe('UserService', () => {
    let service: UserService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [UserService]
        });
        service = TestBed.inject(UserService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getMe', () => {
        it('should fetch current user profile', () => {
            service.getMe().subscribe((user) => {
                expect(user).toEqual(mockUser);
            });

            const req = httpMock.expectOne('http://localhost:3000/api/users/me');
            expect(req.request.method).toBe('GET');
            req.flush(mockUser);
        });
    });

    describe('updateProfile', () => {
        it('should update profile and return updated user', () => {
            const updatedUser = { ...mockUser, name: 'Updated Name' };

            service.updateProfile({ name: 'Updated Name' }).subscribe((user) => {
                expect(user).toEqual(updatedUser);
            });

            const req = httpMock.expectOne('http://localhost:3000/api/users/me');
            expect(req.request.method).toBe('PATCH');
            expect(req.request.body).toEqual({ name: 'Updated Name' });
            req.flush(updatedUser);
        });

        it('should handle update error', () => {
            service.updateProfile({ name: '' }).subscribe({
                error: (error) => {
                    expect(error.status).toBe(400);
                }
            });

            const req = httpMock.expectOne('http://localhost:3000/api/users/me');
            req.flush({ message: 'Validation failed' }, { status: 400, statusText: 'Bad Request' });
        });
    });

    describe('getUsers', () => {
        it('should fetch paginated users', () => {
            const mockResponse = {
                data: [mockUser],
                meta: { total: 1, page: 1, limit: 25, totalPages: 1 }
            };

            service.getUsers({ page: 1, limit: 25, status: 'active' }).subscribe((res) => {
                expect(res.data.length).toBe(1);
                expect(res.meta.total).toBe(1);
            });

            const req = httpMock.expectOne((r) => r.url === 'http://localhost:3000/api/users');
            expect(req.request.method).toBe('GET');
            expect(req.request.params.get('page')).toBe('1');
            expect(req.request.params.get('limit')).toBe('25');
            expect(req.request.params.get('status')).toBe('active');
            req.flush(mockResponse);
        });

        it('should pass name and email filters', () => {
            const mockResponse = { data: [], meta: { total: 0, page: 1, limit: 25, totalPages: 0 } };

            service.getUsers({ name: 'test', email: 'test@example' }).subscribe();

            const req = httpMock.expectOne((r) => r.url === 'http://localhost:3000/api/users');
            expect(req.request.params.get('name')).toBe('test');
            expect(req.request.params.get('email')).toBe('test@example');
            req.flush(mockResponse);
        });
    });

    describe('getUser', () => {
        it('should fetch a user by id', () => {
            service.getUser('1').subscribe((user) => {
                expect(user).toEqual(mockUser);
            });

            const req = httpMock.expectOne('http://localhost:3000/api/users/1');
            expect(req.request.method).toBe('GET');
            req.flush(mockUser);
        });
    });

    describe('updateUser', () => {
        it('should update a user by id', () => {
            const updatedUser = { ...mockUser, name: 'Admin User' };

            service.updateUser('1', { name: 'Admin User' }).subscribe((user) => {
                expect(user.name).toBe('Admin User');
            });

            const req = httpMock.expectOne('http://localhost:3000/api/users/1');
            expect(req.request.method).toBe('PATCH');
            expect(req.request.body).toEqual({ name: 'Admin User' });
            req.flush(updatedUser);
        });
    });

    describe('assignRole', () => {
        it('should assign a role to a user', () => {
            const updatedUser = { ...mockUser, role: { id: '2', name: 'admin' } };

            service.assignRole('1', '2').subscribe((user) => {
                expect(user.role.name).toBe('admin');
            });

            const req = httpMock.expectOne('http://localhost:3000/api/users/1/role');
            expect(req.request.method).toBe('PATCH');
            expect(req.request.body).toEqual({ roleId: '2' });
            req.flush(updatedUser);
        });
    });

    describe('deactivateUser', () => {
        it('should deactivate a user', () => {
            service.deactivateUser('1').subscribe();

            const req = httpMock.expectOne('http://localhost:3000/api/users/1');
            expect(req.request.method).toBe('DELETE');
            req.flush(null, { status: 204, statusText: 'No Content' });
        });
    });

    describe('activateUser', () => {
        it('should activate a user', () => {
            const activatedUser = { ...mockUser, isActive: true };

            service.activateUser('1').subscribe((user) => {
                expect(user.isActive).toBe(true);
            });

            const req = httpMock.expectOne('http://localhost:3000/api/users/1/activate');
            expect(req.request.method).toBe('PATCH');
            req.flush(activatedUser);
        });
    });

    describe('createUser', () => {
        it('should create a user with all fields', () => {
            const newUser = { ...mockUser, email: 'new@example.com', name: 'New User' };

            service.createUser({ email: 'new@example.com', password: 'Password123', name: 'New User', roleId: 'role-1' }).subscribe((user) => {
                expect(user.email).toBe('new@example.com');
                expect(user.name).toBe('New User');
            });

            const req = httpMock.expectOne('http://localhost:3000/api/users');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ email: 'new@example.com', password: 'Password123', name: 'New User', roleId: 'role-1' });
            req.flush(newUser);
        });

        it('should create a user with minimal fields', () => {
            service.createUser({ email: 'new@example.com', password: 'Password123' }).subscribe();

            const req = httpMock.expectOne('http://localhost:3000/api/users');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ email: 'new@example.com', password: 'Password123' });
            req.flush(mockUser);
        });
    });
});
