import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '@shared/services/auth.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `,
})
export class AppMenu {
    private readonly authService = inject(AuthService);

    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Dashboard',
                items: [
                    { label: 'Home', icon: 'pi pi-fw pi-home', routerLink: ['/'] }
                ]
            },
            {
                label: 'Administration',
                items: [
                    {
                        label: 'Users',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/admin/users'],
                        visible: this.authService.hasAnyPermission('users:read', 'roles:read')
                    }
                ]
            },
            {
                label: 'Demo',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-chart-line', routerLink: ['/demo/dashboard'] },
                    {
                        label: 'UI Kit',
                        icon: 'pi pi-fw pi-th-large',
                        path: '/demo/uikit',
                        items: [
                            { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', routerLink: ['/demo/uikit/formlayout'] },
                            { label: 'Input', icon: 'pi pi-fw pi-check-square', routerLink: ['/demo/uikit/input'] },
                            { label: 'Button', icon: 'pi pi-fw pi-mobile', class: 'rotated-icon', routerLink: ['/demo/uikit/button'] },
                            { label: 'Table', icon: 'pi pi-fw pi-table', routerLink: ['/demo/uikit/table'] },
                            { label: 'List', icon: 'pi pi-fw pi-list', routerLink: ['/demo/uikit/list'] },
                            { label: 'Tree', icon: 'pi pi-fw pi-share-alt', routerLink: ['/demo/uikit/tree'] },
                            { label: 'Panel', icon: 'pi pi-fw pi-tablet', routerLink: ['/demo/uikit/panel'] },
                            { label: 'Overlay', icon: 'pi pi-fw pi-clone', routerLink: ['/demo/uikit/overlay'] },
                            { label: 'Media', icon: 'pi pi-fw pi-image', routerLink: ['/demo/uikit/media'] },
                            { label: 'Menu', icon: 'pi pi-fw pi-bars', routerLink: ['/demo/uikit/menu'] },
                            { label: 'Message', icon: 'pi pi-fw pi-comment', routerLink: ['/demo/uikit/message'] },
                            { label: 'File', icon: 'pi pi-fw pi-file', routerLink: ['/demo/uikit/file'] },
                            { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/demo/uikit/charts'] },
                            { label: 'Timeline', icon: 'pi pi-fw pi-calendar', routerLink: ['/demo/uikit/timeline'] },
                            { label: 'Misc', icon: 'pi pi-fw pi-circle', routerLink: ['/demo/uikit/misc'] }
                        ]
                    },
                    { label: 'CRUD', icon: 'pi pi-fw pi-pencil', routerLink: ['/demo/pages/crud'] },
                    { label: 'Landing', icon: 'pi pi-fw pi-globe', routerLink: ['/demo/landing'] },
                    {
                        label: 'Auth',
                        icon: 'pi pi-fw pi-user',
                        path: '/demo/auth',
                        items: [
                            { label: 'Login', icon: 'pi pi-fw pi-sign-in', routerLink: ['/demo/auth/login'] },
                            { label: 'Error', icon: 'pi pi-fw pi-times-circle', routerLink: ['/demo/auth/error'] },
                            { label: 'Access', icon: 'pi pi-fw pi-lock', routerLink: ['/demo/auth/access'] }
                        ]
                    }
                ]
            }
        ];
    }
}
