import { Component, inject, OnInit, signal, computed } from '@angular/core';
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

  private readonly selectedRestaurantIdSignal = signal<number | null>(null);

  private readonly selectedRestaurantSignal = computed(() => {
    const id = this.selectedRestaurantIdSignal();
    return id === null ? undefined : this.orderService.getRestaurantById(id);
  });

  private readonly restaurantsSignal = computed(() => {
    return this.orderService.getRestaurants();
  });

  private readonly menuItemsSignal = computed(() => {
    const restaurant = this.selectedRestaurantSignal();
    return restaurant ? this.orderService.getMenuByRestaurant(restaurant.id) : [];
  });

  private readonly summarySignal = computed(() => {
    return this.orderService.getDashboardSummary();
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.selectedRestaurantIdSignal.set(id ? Number(id) : null);
    });
  }

  get selectedRestaurantId(): number | null {
    return this.selectedRestaurantIdSignal();
  }

  get selectedRestaurant(): RestaurantRecord | undefined {
    return this.selectedRestaurantSignal();
  }

  get restaurants(): RestaurantRecord[] {
    return this.restaurantsSignal();
  }

  get menuItems(): MenuItemRecord[] {
    return this.menuItemsSignal();
  }

  get summary() {
    return this.summarySignal();
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
