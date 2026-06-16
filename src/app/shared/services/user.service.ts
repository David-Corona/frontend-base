import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import type { User, UsersQuery, ChangePasswordRequest } from '@shared/models/user.models';
import type { PaginatedResponse } from '@shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class UserService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/api/users`;

    getMe(): Observable<User> {
        return this.http.get<User>(`${this.baseUrl}/me`);
    }

    updateProfile(data: { name?: string | null }): Observable<User> {
        return this.http.patch<User>(`${this.baseUrl}/me`, data);
    }

    getUsers(params: UsersQuery = {}): Observable<PaginatedResponse<User>> {
        const httpParams: Record<string, string> = {};
        if (params.page) httpParams['page'] = params.page.toString();
        if (params.limit) httpParams['limit'] = params.limit.toString();
        if (params.status) httpParams['status'] = params.status;
        if (params.name) httpParams['name'] = params.name;
        if (params.email) httpParams['email'] = params.email;
        return this.http.get<PaginatedResponse<User>>(this.baseUrl, { params: httpParams });
    }

    getUser(id: string): Observable<User> {
        return this.http.get<User>(`${this.baseUrl}/${id}`);
    }

    updateUser(id: string, data: { name?: string | null }): Observable<User> {
        return this.http.patch<User>(`${this.baseUrl}/${id}`, data);
    }

    assignRole(id: string, roleId: string): Observable<User> {
        return this.http.patch<User>(`${this.baseUrl}/${id}/role`, { roleId });
    }

    deactivateUser(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    activateUser(id: string): Observable<User> {
        return this.http.patch<User>(`${this.baseUrl}/${id}/activate`, {});
    }
}
