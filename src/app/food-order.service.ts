import { Injectable, computed, inject, signal, effect, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth/auth.service';
import { Observable, map } from 'rxjs';

export type OrderStatus = 'Pending' | 'Preparing' | 'Cancelled' | 'Completed';

export interface RestaurantRecord {
  id: number;
  name: string;
  cuisine: string;
  description: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  imageTone: string;
  imageUrl?: string;
  isOpen: boolean;
}

export interface MenuItemRecord {
  id: number;
  restaurantId: number;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  price: number;
  popular: boolean;
  isAvailable?: boolean;
}

export interface CartLineRecord {
  item: MenuItemRecord;
  restaurant: RestaurantRecord;
  quantity: number;
}

export interface DeliveryFormValue {
  userId?: number;
  customerName: string;
  phone: string;
  address: string;
  note: string;
}

export interface FoodOrderRecord {
  id: number;
  userId: number | null;
  customerName: string;
  phone: string;
  address: string;
  note: string;
  description?: string;
  createdAt: Date;
  status: OrderStatus;
  lines: CartLineRecord[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class FoodOrderService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = 'http://localhost:5146/api';
  private readonly cartKey = 'food-order-cart';

  private readonly restaurantsSignal = signal<RestaurantRecord[]>([]);
  private readonly menuItemsMapSignal = signal<Record<number, MenuItemRecord[]>>({});
  private readonly cartLinesSignal = signal<CartLineRecord[]>([]);
  private readonly ordersSignal = signal<FoodOrderRecord[]>([]);
  private readonly dashboardSummarySignal = signal<any>(null);

  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadRestaurants();

      // Auto-sync orders, dashboard summary, and cart when the logged-in user changes
      effect(() => {
        const user = this.authService.currentUser();
        if (user) {
          this.loadOrders(user.id);
          this.loadDashboardSummary(user.id);
          this.syncOrLoadUserCart(user.id);
        } else {
          this.ordersSignal.set([]);
          this.dashboardSummarySignal.set(null);
          this.loadCartFromLocalStorage();
        }
      });
    }
  }

  getRestaurants(): RestaurantRecord[] {
    return this.restaurantsSignal();
  }

  getRestaurantById(id: number): RestaurantRecord | undefined {
    return this.restaurantsSignal().find((restaurant) => restaurant.id === id);
  }

  getMenuByRestaurant(restaurantId: number): MenuItemRecord[] {
    const cached = this.menuItemsMapSignal()[restaurantId];
    if (cached) {
      return cached;
    }
    this.loadMenu(restaurantId);
    return [];
  }

  getCartLines(): CartLineRecord[] {
    return this.cartLinesSignal();
  }

  getOrders(): FoodOrderRecord[] {
    return this.ordersSignal();
  }

  getItemCount(): number {
    return this.cartLinesSignal().reduce((total, line) => total + line.quantity, 0);
  }

  getSubtotal(): number {
    return this.cartLinesSignal().reduce((total, line) => total + line.item.price * line.quantity, 0);
  }

  getDeliveryFee(): number {
    const deliveryFeesByRestaurant = new Map<number, number>();

    for (const line of this.cartLinesSignal()) {
      deliveryFeesByRestaurant.set(line.restaurant.id, line.restaurant.deliveryFee);
    }

    return Array.from(deliveryFeesByRestaurant.values()).reduce((total, fee) => total + fee, 0);
  }

  getTotal(): number {
    return this.getSubtotal() + this.getDeliveryFee();
  }

  addToCart(item: MenuItemRecord): void {
    const restaurant = this.getRestaurantById(item.restaurantId);

    if (!restaurant || !restaurant.isOpen) {
      return;
    }

    const user = this.authService.currentUser();
    if (user) {
      this.http.post<any[]>(`${this.apiUrl}/cart/items`, {
        userId: user.id,
        menuItemId: item.id,
        quantity: 1
      }).subscribe({
        next: (data) => {
          this.cartLinesSignal.set(this.mapCartResponse(data));
          this.loadDashboardSummary(user.id);
        },
        error: (err) => console.error('Failed to add to cart on server', err)
      });
    } else {
      const lines = this.cartLinesSignal();
      const existingLine = lines.find((line) => line.item.id === item.id);

      if (existingLine) {
        this.cartLinesSignal.set(
          lines.map((line) =>
            line.item.id === item.id ? { ...line, quantity: line.quantity + 1 } : line
          )
        );
      } else {
        this.cartLinesSignal.set([...lines, { item, restaurant, quantity: 1 }]);
      }
      this.saveCart();
    }
  }

  removeFromCart(itemId: number): void {
    const lines = this.cartLinesSignal();
    const existingLine = lines.find((line) => line.item.id === itemId);

    if (!existingLine) {
      return;
    }

    const user = this.authService.currentUser();
    if (user) {
      this.http.post<any[]>(`${this.apiUrl}/cart/items`, {
        userId: user.id,
        menuItemId: itemId,
        quantity: -1
      }).subscribe({
        next: (data) => {
          this.cartLinesSignal.set(this.mapCartResponse(data));
          this.loadDashboardSummary(user.id);
        },
        error: (err) => console.error('Failed to remove from cart on server', err)
      });
    } else {
      if (existingLine.quantity === 1) {
        this.cartLinesSignal.set(lines.filter((line) => line.item.id !== itemId));
      } else {
        this.cartLinesSignal.set(
          lines.map((line) =>
            line.item.id === itemId ? { ...line, quantity: line.quantity - 1 } : line
          )
        );
      }
      this.saveCart();
    }
  }

  quantityFor(itemId: number): number {
    return this.cartLinesSignal().find((line) => line.item.id === itemId)?.quantity ?? 0;
  }

  clearCart(): void {
    const user = this.authService.currentUser();
    if (user) {
      // Optimistically clear the signal immediately so the UI updates at once
      this.cartLinesSignal.set([]);
      this.http.delete<any[]>(`${this.apiUrl}/cart?userId=${user.id}`).subscribe({
        next: () => this.loadDashboardSummary(user.id),
        error: (err) => console.error('Failed to clear cart on server', err)
      });
    } else {
      this.cartLinesSignal.set([]);
      this.saveCart();
    }
  }

  createOrder(delivery: DeliveryFormValue): Observable<FoodOrderRecord> {
    const lines = this.cartLinesSignal();
    const restaurantName = lines[0]?.restaurant.name ?? 'Food Order';
    const itemsSummary = lines.map((l) => `${l.item.name} x${l.quantity}`).join(', ');

    const body = {
      title: `Order from ${restaurantName}`,
      description: itemsSummary,
      typeOrPriority: 'Delivery',
      customerName: delivery.customerName,
      phone: delivery.phone,
      address: delivery.address,
      note: delivery.note,
      relatedUserId: delivery.userId,
      lines: lines.map((line) => ({
        menuItemId: line.item.id,
        quantity: line.quantity
      }))
    };

    return this.http.post<FoodOrderRecord>(`${this.apiUrl}/orders`, body).pipe(
      map((order) => {
        // Map backend Date string to Date object
        const mappedOrder = {
          ...order,
          createdAt: new Date(order.createdAt)
        };

        this.ordersSignal.update((orders) => [mappedOrder, ...orders]);
        this.clearCart();

        // Refresh dashboard summary
        const user = this.authService.currentUser();
        if (user) {
          this.loadDashboardSummary(user.id);
        }

        return mappedOrder;
      })
    );
  }

  updateOrder(orderId: number, address: string, note: string): Observable<FoodOrderRecord> {
    return this.http.put<FoodOrderRecord>(`${this.apiUrl}/orders/${orderId}`, { address, note }).pipe(
      map((updatedOrder) => {
        const mapped = {
          ...updatedOrder,
          createdAt: new Date(updatedOrder.createdAt)
        };
        this.ordersSignal.update((orders) =>
          orders.map((o) => (o.id === orderId ? { ...o, address: mapped.address, note: mapped.note } : o))
        );
        return mapped;
      })
    );
  }

  cancelOrder(orderId: number): void {
    this.http.put(`${this.apiUrl}/orders/${orderId}/cancel`, {}).subscribe({
      next: () => {
        this.ordersSignal.update((orders) =>
          orders.map((o) => (o.id === orderId ? { ...o, status: 'Cancelled' as OrderStatus } : o))
        );

        // Refresh dashboard summary
        const user = this.authService.currentUser();
        if (user) {
          this.loadDashboardSummary(user.id);
        }
      },
      error: (err) => console.error('Failed to cancel order', err)
    });
  }

  // --- Admin Panel API Methods ---

  getAllOrdersAdmin(): Observable<FoodOrderRecord[]> {
    return this.http.get<any[]>(`${this.apiUrl}/orders`).pipe(
      map((orders) =>
        orders.map((o) => ({
          ...o,
          createdAt: new Date(o.createdAt),
          lines: o.lines.map((l: any) => ({
            item: { id: l.menuItemId, name: l.name, price: l.price },
            quantity: l.quantity
          }))
        }))
      )
    );
  }

  getGlobalDashboardSummaryAdmin(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/summary`);
  }

  updateOrderStatusAdmin(orderId: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${orderId}/status`, { status });
  }

  toggleRestaurantOpenAdmin(restaurantId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/restaurants/${restaurantId}/toggle-status`, {});
  }

  deleteOrderAdmin(orderId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/orders/${orderId}`);
  }

  getRestaurantMenuAdmin(restaurantId: number): Observable<MenuItemRecord[]> {
  return this.http.get<MenuItemRecord[]>(
    `${this.apiUrl}/restaurants/${restaurantId}/menu`  // ← remove /admin/
  );
}

  createMenuItemAdmin(restaurantId: number, dto: any): Observable<MenuItemRecord> {
    return this.http.post<MenuItemRecord>(`${this.apiUrl}/restaurants/${restaurantId}/menu`, dto);
  }

  updateMenuItemAdmin(id: number, dto: any): Observable<MenuItemRecord> {
    return this.http.put<MenuItemRecord>(`${this.apiUrl}/restaurants/menu/${id}`, dto);
  }

  deleteMenuItemAdmin(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/restaurants/menu/${id}`);
  }

  createRestaurantAdmin(dto: any): Observable<RestaurantRecord> {
    return this.http.post<RestaurantRecord>(`${this.apiUrl}/restaurants`, dto);
  }

  updateRestaurantAdmin(id: number, dto: any): Observable<RestaurantRecord> {
    return this.http.put<RestaurantRecord>(`${this.apiUrl}/restaurants/${id}`, dto);
  }

  deleteRestaurantAdmin(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/restaurants/${id}`);
  }

  getDashboardSummary() {
    const summary = this.dashboardSummarySignal();
    return {
      restaurants: summary?.restaurants ?? 0,
      openRestaurants: summary?.openRestaurants ?? 0,
      menuItems: summary?.menuItems ?? 0,
      cartItems: this.getItemCount(),
      activeOrders: summary?.activeOrders ?? 0,
      revenue: summary?.revenue ?? 0
    };
  }

  formatCurrency(value: number): string {
    return `THB ${value.toLocaleString('en-US')}`;
  }

  // --- HTTP Helpers ---

  loadRestaurants(): void {
    this.http.get<RestaurantRecord[]>(`${this.apiUrl}/restaurants`).subscribe({
      next: (data) => this.restaurantsSignal.set(data),
      error: (err) => console.error('Failed to load restaurants', err)
    });
  }

  private loadMenu(restaurantId: number): void {
    this.http.get<MenuItemRecord[]>(`${this.apiUrl}/restaurants/${restaurantId}/menu`).subscribe({
      next: (data) => {
        this.menuItemsMapSignal.update((map) => ({ ...map, [restaurantId]: data }));
      },
      error: (err) => console.error(`Failed to load menu for restaurant ${restaurantId}`, err)
    });
  }

  private loadOrders(userId: number): void {
    this.http.get<any[]>(`${this.apiUrl}/orders?userId=${userId}`).pipe(
      map((orders) =>
        orders.map((o) => ({
          ...o,
          createdAt: new Date(o.createdAt),
          lines: o.lines.map((l: any) => {
            const restaurant = this.getRestaurantById(1); // Default fallbacks or map accordingly
            const item: MenuItemRecord = {
              id: l.menuItemId,
              restaurantId: 1,
              name: l.name,
              description: '',
              category: '',
              imageUrl: '',
              price: l.price,
              popular: false
            };
            return {
              item,
              restaurant: restaurant ?? {
                id: 1,
                name: 'Restaurant',
                cuisine: '',
                description: '',
                rating: 5,
                deliveryTime: '',
                deliveryFee: 0,
                imageTone: 'thai',
                imageUrl: '',
                isOpen: true
              },
              quantity: l.quantity
            };
          })
        }))
      )
    ).subscribe({
      next: (data) => this.ordersSignal.set(data),
      error: (err) => console.error('Failed to load orders', err)
    });
  }

  private loadDashboardSummary(userId: number): void {
    this.http.get<any>(`${this.apiUrl}/dashboard/summary?userId=${userId}`).subscribe({
      next: (data) => this.dashboardSummarySignal.set(data),
      error: (err) => console.error('Failed to load dashboard summary', err)
    });
  }

  // --- Cart Storage Helpers ---

  private syncOrLoadUserCart(userId: number): void {
    let localCart: CartLineRecord[] = [];
    if (this.hasStorage()) {
      try {
        const data = localStorage.getItem(this.cartKey);
        if (data) {
          localCart = JSON.parse(data);
        }
      } catch {
        // Ignore
      }
    }

    if (localCart.length > 0) {
      const items = localCart.map(line => ({
        menuItemId: line.item.id,
        quantity: line.quantity
      }));
      this.http.post<any[]>(`${this.apiUrl}/cart/merge`, { userId, items }).subscribe({
        next: (data) => {
          this.cartLinesSignal.set(this.mapCartResponse(data));
          if (this.hasStorage()) {
            localStorage.removeItem(this.cartKey);
          }
        },
        error: (err) => {
          console.error('Failed to merge cart', err);
          this.loadCartFromServer(userId);
        }
      });
    } else {
      this.loadCartFromServer(userId);
    }
  }

  private loadCartFromServer(userId: number): void {
    this.http.get<any[]>(`${this.apiUrl}/cart?userId=${userId}`).subscribe({
      next: (data) => this.cartLinesSignal.set(this.mapCartResponse(data)),
      error: (err) => console.error('Failed to load cart from server', err)
    });
  }

  private loadCartFromLocalStorage(): void {
    if (this.hasStorage()) {
      try {
        const data = localStorage.getItem(this.cartKey);
        if (data) {
          this.cartLinesSignal.set(JSON.parse(data));
        } else {
          this.cartLinesSignal.set([]);
        }
      } catch {
        this.cartLinesSignal.set([]);
      }
    } else {
      this.cartLinesSignal.set([]);
    }
  }

  private mapCartResponse(data: any[]): CartLineRecord[] {
    return data.map(item => ({
      item: {
        id: item.item.id,
        restaurantId: item.item.restaurantId,
        name: item.item.name,
        description: item.item.description,
        category: item.item.category,
        imageUrl: item.item.imageUrl,
        price: item.item.price,
        popular: item.item.popular,
        isAvailable: item.item.isAvailable
      },
      restaurant: {
        id: item.restaurant.id,
        name: item.restaurant.name,
        cuisine: item.restaurant.cuisine,
        description: item.restaurant.description,
        rating: item.restaurant.rating,
        deliveryTime: item.restaurant.deliveryTime,
        deliveryFee: item.restaurant.deliveryFee,
        imageTone: item.restaurant.imageTone,
        imageUrl: item.restaurant.imageUrl,
        isOpen: item.restaurant.isOpen
      },
      quantity: item.quantity
    }));
  }

  private saveCart(): void {
    if (this.hasStorage()) {
      localStorage.setItem(this.cartKey, JSON.stringify(this.cartLinesSignal()));
    }
  }

  private hasStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }
}
