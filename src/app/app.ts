import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Badge } from 'primeng/badge';
import { AuthService } from './auth/auth.service';
import { FoodOrderService } from './food-order.service';

@Component({
  selector: 'app-root',
  imports: [Badge, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly orderService = inject(FoodOrderService);

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}
