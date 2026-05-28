import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth/auth.service';
import { FoodOrderService, MenuItemRecord, RestaurantRecord } from './food-order.service';

describe('FoodOrderService', () => {
  let service: FoodOrderService;
  let httpMock: HttpTestingController;

  const restaurants: RestaurantRecord[] = [
    {
      id: 1,
      name: 'Thai Garden',
      cuisine: 'Thai',
      description: 'Classic Thai dishes',
      rating: 4.8,
      deliveryTime: '15-20 min',
      deliveryFee: 35,
      imageTone: 'thai',
      imageUrl: 'thai.jpg',
      isOpen: true
    },
    {
      id: 2,
      name: 'Sushi Bar',
      cuisine: 'Japanese',
      description: 'Fresh sushi',
      rating: 4.7,
      deliveryTime: '20-25 min',
      deliveryFee: 35,
      imageTone: 'japanese',
      imageUrl: 'sushi.jpg',
      isOpen: true
    },
    {
      id: 3,
      name: 'Burger House',
      cuisine: 'American',
      description: 'Burgers and fries',
      rating: 4.6,
      deliveryTime: '20-30 min',
      deliveryFee: 35,
      imageTone: 'burger',
      imageUrl: 'burger.jpg',
      isOpen: true
    }
  ];

  const authServiceStub = {
    currentUser: () => null
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        FoodOrderService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceStub }
      ]
    });

    service = TestBed.inject(FoodOrderService);
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('http://localhost:5146/api/restaurants').flush(restaurants);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('charges delivery once for items from the same restaurant', () => {
    const menu = loadMenu(1, [
      createMenuItem(101, 1, 'Pad Thai', 80),
      createMenuItem(102, 1, 'Green Curry', 95)
    ]);

    service.addToCart(menu[0]!);
    service.addToCart(menu[1]!);

    expect(service.getDeliveryFee()).toBe(35);
    expect(service.getTotal()).toBe(service.getSubtotal() + 35);
  });

  it('adds delivery fees when cart has different restaurants', () => {
    service.addToCart(loadMenu(1, [createMenuItem(101, 1, 'Pad Thai', 80)])[0]!);
    service.addToCart(loadMenu(2, [createMenuItem(201, 2, 'Salmon Roll', 120)])[0]!);
    service.addToCart(loadMenu(3, [createMenuItem(301, 3, 'Cheeseburger', 110)])[0]!);

    expect(service.getDeliveryFee()).toBe(105);
    expect(service.getTotal()).toBe(service.getSubtotal() + 105);
  });

  function loadMenu(restaurantId: number, items: MenuItemRecord[]): MenuItemRecord[] {
    service.getMenuByRestaurant(restaurantId);
    httpMock.expectOne(`http://localhost:5146/api/restaurants/${restaurantId}/menu`).flush(items);

    return service.getMenuByRestaurant(restaurantId);
  }

  function createMenuItem(
    id: number,
    restaurantId: number,
    name: string,
    price: number
  ): MenuItemRecord {
    return {
      id,
      restaurantId,
      name,
      price,
      description: `${name} description`,
      category: 'Main',
      imageUrl: `${id}.jpg`,
      popular: false,
      isAvailable: true
    };
  }
});
