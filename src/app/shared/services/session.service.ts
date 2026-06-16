import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import type { Session } from '@shared/models/session.models';
import type { PaginatedResponse } from '@shared/models/api.models';

const AUTH_API = `${environment.apiUrl}/api/auth`;

@Injectable({ providedIn: 'root' })
export class SessionService {
    private readonly http = inject(HttpClient);

    getSessions(page = 1, limit = 10): Observable<PaginatedResponse<Session>> {
        return this.http.get<PaginatedResponse<Session>>(`${AUTH_API}/sessions`, {
            params: { page: page.toString(), limit: limit.toString() }
        });
    }

    terminateSession(sessionId: string): Observable<void> {
        return this.http.delete<void>(`${AUTH_API}/sessions/${encodeURIComponent(sessionId)}`);
    }

    terminateAllSessions(): Observable<void> {
        return this.http.delete<void>(`${AUTH_API}/sessions`);
    }
}
