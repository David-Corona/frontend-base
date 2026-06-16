import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import type { Role } from '@shared/models/role.models';
import type { PaginatedResponse } from '@shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class RoleService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/api/roles`;

    getRoles(page = 1, limit = 100): Observable<PaginatedResponse<Role>> {
        return this.http.get<PaginatedResponse<Role>>(this.baseUrl, {
            params: { page: page.toString(), limit: limit.toString() }
        });
    }
}
