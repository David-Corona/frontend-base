import { Injectable, signal } from '@angular/core';

export interface PendingToast {
    severity: 'success' | 'error' | 'warn' | 'info';
    summary: string;
    detail: string;
}

@Injectable({ providedIn: 'root' })
export class ToastNotificationService {
    private readonly _pending = signal<PendingToast | null>(null);

    readonly pending = this._pending.asReadonly();

    set(toast: PendingToast): void {
        this._pending.set(toast);
    }

    consume(): PendingToast | null {
        const value = this._pending();
        if (value) {
            this._pending.set(null);
        }
        return value;
    }
}
