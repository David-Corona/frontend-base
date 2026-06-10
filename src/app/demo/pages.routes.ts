import { Routes } from '@angular/router';
import { Crud } from './crud/crud';

export default [
    { path: 'crud', component: Crud },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
