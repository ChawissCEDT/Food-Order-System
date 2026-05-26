import { FoodOrderService } from './food-order.service';

describe('FoodOrderService', () => {
  let service: FoodOrderService;

  beforeEach(() => {
    service = new FoodOrderService();
  });

  it('charges delivery once for items from the same restaurant', () => {
    service.addToCart(service.getMenuByRestaurant(1)[0]!);
    service.addToCart(service.getMenuByRestaurant(1)[1]!);

    expect(service.getDeliveryFee()).toBe(35);
    expect(service.getTotal()).toBe(service.getSubtotal() + 35);
  });

  it('adds delivery fees when cart has different restaurants', () => {
    service.addToCart(service.getMenuByRestaurant(1)[0]!);
    service.addToCart(service.getMenuByRestaurant(2)[0]!);
    service.addToCart(service.getMenuByRestaurant(3)[0]!);

    expect(service.getDeliveryFee()).toBe(105);
    expect(service.getTotal()).toBe(service.getSubtotal() + 105);
  });
});
