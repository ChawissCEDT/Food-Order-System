import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Badge } from 'primeng/badge';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { AuthService } from '../auth/auth.service';
import { FoodOrderService, MenuItemRecord, RestaurantRecord } from '../food-order.service';

@Component({
  selector: 'app-restaurant',
  imports: [Badge, Button, Card, RouterLink, Tag],
  templateUrl: './restaurant.html',
  styleUrl: './restaurant.css'
})
export class Restaurant implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly orderService = inject(FoodOrderService);

  ngOnInit(): void {
    this.orderService.loadRestaurants();
  }

  get selectedRestaurantId(): number | null {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? Number(id) : null;
  }

  get selectedRestaurant(): RestaurantRecord | undefined {
    const id = this.selectedRestaurantId;
    return id === null ? undefined : this.orderService.getRestaurantById(id);
  }

  get restaurants(): RestaurantRecord[] {
    return this.orderService.getRestaurants();
  }

  get menuItems(): MenuItemRecord[] {
    const restaurant = this.selectedRestaurant;
    return restaurant ? this.orderService.getMenuByRestaurant(restaurant.id) : [];
  }

  get summary() {
    return this.orderService.getDashboardSummary();
  }

  addItem(item: MenuItemRecord): void {
    if (!this.authService.currentUser()) {
      void this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: this.router.url
        }
      });
      return;
    }

    this.orderService.addToCart(item);
  }

  removeItem(item: MenuItemRecord): void {
    this.orderService.removeFromCart(item.id);
  }
}
