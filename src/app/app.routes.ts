import { Routes } from '@angular/router';
import { Admin } from './admin/admin';
import { adminGuard } from './auth/admin.guard';
import { authGuard } from './auth/auth.guard';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { Orders } from './orders/orders';
import { Restaurant } from './restaurant/restaurant';

export const routes: Routes = [
  { path: '', redirectTo: 'restaurant', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'restaurant', component: Restaurant },
  { path: 'restaurant/:id', component: Restaurant },
  { path: 'orders', component: Orders, canActivate: [authGuard] },
  { path: 'admin', component: Admin, canActivate: [adminGuard] },
  { path: '**', redirectTo: 'restaurant' }
];
