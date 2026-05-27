import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { FoodOrderService, FoodOrderRecord, RestaurantRecord, MenuItemRecord } from '../food-order.service';
import { AuthService } from '../auth/auth.service';
import { Signal } from '@angular/core';

@Component({
  selector: 'app-admin',
  imports: [Button, Tag, DatePipe, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  readonly orderService = inject(FoodOrderService);
  readonly authService = inject(AuthService);

  globalSummary = signal<any>(null);
  allOrders = signal<FoodOrderRecord[]>([]);
  
  get restaurantsList(): RestaurantRecord[] {
    return this.orderService.getRestaurants();
  }

  // Restaurant form variables
  showForm = signal<boolean>(false);
  editingShopId = signal<number | null>( null);
  shopName = signal('');
  shopCuisine = signal('');
  shopDescription = signal('');
  shopDeliveryTime = signal('15-20 min');
  shopDeliveryFee = signal(0);
  shopRating = signal(5.0);
  shopImageTone = signal('thai');
  shopImageUrl = signal('');

  // Menu Manager state
  selectedShopForMenu = signal<RestaurantRecord | null>( null);
  menuItemsList = signal<MenuItemRecord[]>([]);
  showMenuForm = signal(false);
  editingMenuItemId  = signal<number | null>( null);
  menuName = signal('');
  menuDescription = signal('');
  menuCategory = signal('');
  menuImageUrl = signal('');
  menuPrice = signal(0);
  menuPopular = signal(false);
  menuIsAvailable = signal(true);

  activeTab  = signal<'summary' | 'shops' | 'orders'>('summary');

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(): void {
    this.loadGlobalSummary();
    this.loadAllOrders();
    this.orderService.loadRestaurants();
  }

  loadGlobalSummary(): void {
    this.orderService.getGlobalDashboardSummaryAdmin().subscribe({
      next: (summary) => {
        this.globalSummary.set(summary);
      },
      error: (err) => console.error('Failed to load global summary', err)
    });
  }

  loadAllOrders(): void {
    this.orderService.getAllOrdersAdmin().subscribe({
      next: (orders) => {
        this.allOrders.set(orders);
      },
      error: (err) => console.error('Failed to load all orders', err)
    });
  }

  toggleShop(shopId: number): void {
    this.orderService.toggleRestaurantOpenAdmin(shopId).subscribe({
      next: () => {
        this.refreshAll();
      },
      error: (err) => console.error('Failed to toggle restaurant status', err)
    });
  }

  updateStatus(orderId: number, status: string): void {
    this.orderService.updateOrderStatusAdmin(orderId, status).subscribe({
      next: () => {
        this.refreshAll();
      },
      error: (err) => console.error('Failed to update order status', err)
    });
  }

  deleteOrder(orderId: number): void {
    if (confirm('Are you sure you want to delete this order?')) {
      this.orderService.deleteOrderAdmin(orderId).subscribe({
        next: () => {
          this.refreshAll();
        },
        error: (err) => console.error('Failed to delete order', err)
      });
    }
  }

  // Restaurant CRUD Operations
  openAddForm(): void {
    this.showForm.set(true);
    this.editingShopId.set(null);
    this.shopName.set('');
    this.shopCuisine.set('');
    this.shopDescription.set('');
    this.shopDeliveryTime.set('15-20 min');
    this.shopDeliveryFee.set(0);
    this.shopRating.set(5.0);
    this.shopImageTone.set('thai');
    this.shopImageUrl.set('');
  }

  openEditForm(shop: RestaurantRecord): void {
    this.showForm.set(true);
    this.editingShopId.set(shop.id);
    this.shopName.set(shop.name);
    this.shopCuisine.set(shop.cuisine);
    this.shopDescription.set(shop.description);
    this.shopDeliveryTime.set(shop.deliveryTime);
    this.shopDeliveryFee.set(shop.deliveryFee);
    this.shopRating.set(shop.rating);
    this.shopImageTone.set(shop.imageTone);
    this.shopImageUrl.set(shop.imageUrl || '');
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingShopId.set(null);
  }

  saveRestaurant(event: Event): void {
    event.preventDefault();
    if (!this.shopName().trim() || !this.shopCuisine().trim() || !this.shopDescription().trim() || !this.shopDeliveryTime().trim() || !this.shopImageUrl().trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    const payload = {
      name: this.shopName,
      cuisine: this.shopCuisine,
      description: this.shopDescription,
      deliveryTime: this.shopDeliveryTime,
      deliveryFee: this.shopDeliveryFee,
      rating: this.shopRating,
      imageTone: this.shopImageTone,
      imageUrl: this.shopImageUrl
    };

    if (this.editingShopId) {
      const existing = this.restaurantsList.find(r => r.id === this.editingShopId());
      const updatePayload = {
        ...payload,
        isOpen: existing ? existing.isOpen : true
      };

      this.orderService.updateRestaurantAdmin(this.editingShopId()!, updatePayload).subscribe({
        next: () => {
          this.closeForm();
          this.refreshAll();
        },
        error: (err) => {
          console.error('Failed to update restaurant', err);
          alert('Failed to update restaurant.');
        }
      });
    } else {
      this.orderService.createRestaurantAdmin(payload).subscribe({
        next: () => {
          this.closeForm();
          this.refreshAll();
        },
        error: (err) => {
          console.error('Failed to create restaurant', err);
          alert('Failed to create restaurant.');
        }
      });
    }
  }

  deleteRestaurant(id: number): void {
    if (confirm('Are you sure you want to permanently delete this restaurant? This will also delete all of its menu items.')) {
      this.orderService.deleteRestaurantAdmin(id).subscribe({
        next: () => {
          this.refreshAll();
        },
        error: (err) => {
          console.error('Failed to delete restaurant', err);
          alert('Failed to delete restaurant.');
        }
      });
    }
  }

  // Menu Manager Operations
  openMenuManager(shop: RestaurantRecord): void {
    this.selectedShopForMenu.set(shop);
    this.showMenuForm.set(false);
    this.editingMenuItemId.set(null);
    this.loadMenuForShop(shop.id);  // this is already correct
  }

  closeMenuManager(): void {
    this.selectedShopForMenu.set(null);
    this.menuItemsList.set([]);
    this.showMenuForm.set(false);
    this.editingMenuItemId.set(null);
  }

  loadMenuForShop(restaurantId: number): void {
    this.orderService.getRestaurantMenuAdmin(restaurantId).subscribe({
      next: (items) => { this.menuItemsList.set(items);  },
      error: (err) => console.error('Failed to load menu', err)
    });
  }

  openAddMenuForm(): void {
    this.showMenuForm.set(true);
    this.editingMenuItemId.set(null);
    this.menuName.set('');
    this.menuDescription.set('');
    this.menuCategory.set('');
    this.menuImageUrl.set('');
    this.menuPrice.set(0);
    this.menuPopular.set(false);
    this.menuIsAvailable.set(true);
  }

  openEditMenuForm(item: MenuItemRecord): void {
    this.showMenuForm.set(true);
    this.editingMenuItemId.set(item.id);
    this.menuName.set(item.name);
    this.menuDescription.set(item.description);
    this.menuCategory.set(item.category);
    this.menuImageUrl.set(item.imageUrl || '');
    this.menuPrice.set(item.price);
    this.menuPopular.set(item.popular);
    this.menuIsAvailable.set(item.isAvailable ?? true);
  }

  closeMenuForm(): void {
    this.showMenuForm.set(false);
    this.editingMenuItemId.set(null);
  }

  saveMenuItem(event: Event): void {
    event.preventDefault();
    if (!this.menuName().trim() || !this.menuDescription().trim() || !this.menuCategory().trim() || !this.menuImageUrl().trim() || this.menuPrice() <= 0) {
      alert('Please fill out all required fields and ensure price is greater than 0.');
      return;
    }

    const payload = {
      name: this.menuName,
      description: this.menuDescription,
      category: this.menuCategory,
      imageUrl: this.menuImageUrl,
      price: this.menuPrice,
      popular: this.menuPopular,
      isAvailable: this.menuIsAvailable
    };

    if (this.editingMenuItemId) {
      this.orderService.updateMenuItemAdmin(this.editingMenuItemId()!, payload).subscribe({
        next: () => {
          this.closeMenuForm();
          this.loadMenuForShop(this.selectedShopForMenu()!.id);
        },
        error: (err) => { console.error('Failed to update menu item', err); alert('Failed to update menu item.'); }
      });
    } else {
      this.orderService.createMenuItemAdmin(this.selectedShopForMenu()!.id, payload).subscribe({
        next: () => {
          this.closeMenuForm();
          this.loadMenuForShop(this.selectedShopForMenu()!.id);
        },
        error: (err) => { console.error('Failed to create menu item', err); alert('Failed to create menu item.'); }
      });
    }
  }

  deleteMenuItem(id: number): void {
    if (confirm('Are you sure you want to permanently delete this menu item?')) {
      this.orderService.deleteMenuItemAdmin(id).subscribe({
        next: () => { this.loadMenuForShop(this.selectedShopForMenu()!.id); },
        error: (err) => { console.error('Failed to delete menu item', err); alert('Failed to delete menu item.'); }
      });
    }
  }

  switchTab(tab: 'summary' | 'shops' | 'orders'): void {
    this.activeTab.set(tab);
    if (tab !== 'shops') {
      this.closeMenuManager();
    }
  }
}
