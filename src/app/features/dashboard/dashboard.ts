import { Component } from '@angular/core';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    template: `
        <div class="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Dashboard</h1>
            <p class="text-muted-color">Coming soon</p>
        </div>
    `
})
export class Dashboard {}
