import { Injectable } from '@angular/core';

export type OrderStatus = 'Pending' | 'Preparing' | 'Cancelled';

export interface RestaurantRecord {
  id: number;
  name: string;
  cuisine: string;
  description: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  imageTone: string;
  isOpen: boolean;
}

export interface MenuItemRecord {
  id: number;
  restaurantId: number;
  name: string;
  description: string;
  category: string;
  price: number;
  popular: boolean;
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
  // TODO(database): Replace this seed array with restaurant records from the database.
  // Suggested fields: id, name, cuisine, description, rating, delivery_time,
  // delivery_fee, image_url/image_tone, is_open, created_at, and updated_at.
  private readonly restaurants: RestaurantRecord[] = [
    {
      id: 1,
      name: 'Siam Street Kitchen',
      cuisine: 'Thai comfort food',
      description: 'Fast campus delivery for rice dishes, curry, noodles, and Thai tea.',
      rating: 4.8,
      deliveryTime: '20-30 min',
      deliveryFee: 35,
      imageTone: 'thai',
      isOpen: true
    },
    {
      id: 2,
      name: 'Pasta Lab',
      cuisine: 'Italian bowls',
      description: 'Creamy pasta, tomato classics, garlic bread, and quick lunch sets.',
      rating: 4.6,
      deliveryTime: '25-35 min',
      deliveryFee: 40,
      imageTone: 'pasta',
      isOpen: true
    },
    {
      id: 3,
      name: 'Burger Yard',
      cuisine: 'Burgers and fries',
      description: 'Stacked burgers, loaded fries, chicken bites, and cold drinks.',
      rating: 4.7,
      deliveryTime: '18-28 min',
      deliveryFee: 30,
      imageTone: 'burger',
      isOpen: true
    },
    {
      id: 4,
      name: 'Green Bowl',
      cuisine: 'Healthy meals',
      description: 'Salads, protein bowls, smoothies, and light dinner options.',
      rating: 4.5,
      deliveryTime: '22-32 min',
      deliveryFee: 25,
      imageTone: 'green',
      isOpen: false
    }
  ];

  // TODO(database): Replace this seed menu with menu_items joined to restaurants.
  // Suggested fields: id, restaurant_id, name, description, category, price,
  // is_popular, image_url, is_available, created_at, and updated_at.
  private readonly menuItems: MenuItemRecord[] = [
    {
      id: 101,
      restaurantId: 1,
      name: 'Basil Chicken Rice',
      description: 'Holy basil chicken, jasmine rice, crispy egg, and chili fish sauce.',
      category: 'Rice',
      price: 89,
      popular: true
    },
    {
      id: 102,
      restaurantId: 1,
      name: 'Tom Yum Seafood Noodles',
      description: 'Spicy-sour broth with shrimp, squid, mushrooms, lime, and roasted chili.',
      category: 'Noodles',
      price: 129,
      popular: true
    },
    {
      id: 103,
      restaurantId: 1,
      name: 'Thai Milk Tea',
      description: 'Strong tea, creamy milk, and light brown sugar over ice.',
      category: 'Drink',
      price: 45,
      popular: false
    },
    {
      id: 201,
      restaurantId: 2,
      name: 'Carbonara Bowl',
      description: 'Cream sauce, smoked bacon, parmesan, black pepper, and spaghetti.',
      category: 'Pasta',
      price: 139,
      popular: true
    },
    {
      id: 202,
      restaurantId: 2,
      name: 'Pomodoro Pasta',
      description: 'Tomato sauce, garlic, basil, olive oil, and parmesan.',
      category: 'Pasta',
      price: 119,
      popular: false
    },
    {
      id: 203,
      restaurantId: 2,
      name: 'Garlic Bread',
      description: 'Toasted bread with garlic butter and herbs.',
      category: 'Side',
      price: 59,
      popular: false
    },
    {
      id: 301,
      restaurantId: 3,
      name: 'Classic Beef Burger',
      description: 'Beef patty, cheddar, pickles, onion, lettuce, and house sauce.',
      category: 'Burger',
      price: 149,
      popular: true
    },
    {
      id: 302,
      restaurantId: 3,
      name: 'Chicken Bites',
      description: 'Crispy chicken pieces with honey mustard dip.',
      category: 'Side',
      price: 95,
      popular: false
    },
    {
      id: 303,
      restaurantId: 3,
      name: 'Loaded Fries',
      description: 'Fries with cheese sauce, bacon bits, and scallion.',
      category: 'Side',
      price: 99,
      popular: true
    },
    {
      id: 401,
      restaurantId: 4,
      name: 'Salmon Protein Bowl',
      description: 'Grilled salmon, brown rice, edamame, corn, and sesame dressing.',
      category: 'Bowl',
      price: 169,
      popular: true
    },
    {
      id: 402,
      restaurantId: 4,
      name: 'Avocado Salad',
      description: 'Mixed greens, avocado, tomato, cucumber, and lemon vinaigrette.',
      category: 'Salad',
      price: 129,
      popular: false
    }
  ];

  // TODO(database/session): This cart is only in memory and disappears on refresh.
  // Persist cart items by user/session if the cart must survive reloads.
  private cartLines: CartLineRecord[] = [];
  // TODO(database): Orders are currently in memory only. Persist order headers and
  // order_items rows so history, revenue, and cancellation work after refresh.
  private orders: FoodOrderRecord[] = [];
  // TODO(database): Let the database generate order IDs instead of using a local counter.
  private nextOrderId = 1001;

  getRestaurants(): RestaurantRecord[] {
    return this.restaurants;
  }

  getRestaurantById(id: number): RestaurantRecord | undefined {
    return this.restaurants.find((restaurant) => restaurant.id === id);
  }

  getMenuByRestaurant(restaurantId: number): MenuItemRecord[] {
    return this.menuItems.filter((item) => item.restaurantId === restaurantId);
  }

  getCartLines(): CartLineRecord[] {
    return this.cartLines;
  }

  getOrders(): FoodOrderRecord[] {
    return this.orders;
  }

  getItemCount(): number {
    return this.cartLines.reduce((total, line) => total + line.quantity, 0);
  }

  getSubtotal(): number {
    return this.cartLines.reduce((total, line) => total + line.item.price * line.quantity, 0);
  }

  getDeliveryFee(): number {
    const deliveryFeesByRestaurant = new Map<number, number>();

    for (const line of this.cartLines) {
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

    const existingLine = this.cartLines.find((line) => line.item.id === item.id);

    if (existingLine) {
      existingLine.quantity += 1;
      return;
    }

    this.cartLines = [...this.cartLines, { item, restaurant, quantity: 1 }];
  }

  removeFromCart(itemId: number): void {
    const existingLine = this.cartLines.find((line) => line.item.id === itemId);

    if (!existingLine) {
      return;
    }

    if (existingLine.quantity === 1) {
      this.cartLines = this.cartLines.filter((line) => line.item.id !== itemId);
      return;
    }

    existingLine.quantity -= 1;
  }

  quantityFor(itemId: number): number {
    return this.cartLines.find((line) => line.item.id === itemId)?.quantity ?? 0;
  }

  clearCart(): void {
    this.cartLines = [];
  }

  createOrder(delivery: DeliveryFormValue): FoodOrderRecord {
    // TODO(api/database): Create the order in a backend transaction:
    // insert the order header, insert order item snapshots, then clear the persisted cart.
    const order: FoodOrderRecord = {
      id: this.nextOrderId,
      userId: delivery.userId ?? null,
      customerName: delivery.customerName,
      phone: delivery.phone,
      address: delivery.address,
      note: delivery.note,
      createdAt: new Date(),
      status: 'Pending',
      lines: this.cartLines.map((line) => ({ ...line })),
      subtotal: this.getSubtotal(),
      deliveryFee: this.getDeliveryFee(),
      total: this.getTotal()
    };

    this.nextOrderId += 1;
    this.orders = [order, ...this.orders];
    this.clearCart();

    return order;
  }

  cancelOrder(orderId: number): void {
    // TODO(api/database): Update the order status in the database, scoped to
    // the current user or an authorized staff/admin role.
    const order = this.orders.find((currentOrder) => currentOrder.id === orderId);

    if (order && order.status !== 'Cancelled') {
      order.status = 'Cancelled';
    }
  }

  getDashboardSummary() {
    // TODO(database): These summary values are calculated from local mock arrays.
    // For production, fetch aggregate counts/revenue from database queries.
    return {
      restaurants: this.restaurants.length,
      openRestaurants: this.restaurants.filter((restaurant) => restaurant.isOpen).length,
      menuItems: this.menuItems.length,
      cartItems: this.getItemCount(),
      activeOrders: this.orders.filter((order) => order.status !== 'Cancelled').length,
      revenue: this.orders
        .filter((order) => order.status !== 'Cancelled')
        .reduce((total, order) => total + order.total, 0)
    };
  }

  formatCurrency(value: number): string {
    return `THB ${value.toLocaleString('en-US')}`;
  }
}
