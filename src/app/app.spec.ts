import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { FoodOrderService } from './food-order.service';

describe('App', () => {
  const sessionKey = 'food-order-current-user';
  const foodOrderServiceStub = {
    getItemCount: () => 0
  };

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: FoodOrderService, useValue: foodOrderServiceStub }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Food Order App');
    expect(compiled.textContent).toContain('Restaurants');
    expect(compiled.textContent).toContain('Orders');
  });

  it('shows the Admin navigation tab for admin users', async () => {
    localStorage.setItem(sessionKey, JSON.stringify({
      id: 1,
      name: 'System Admin',
      email: 'admin@example.com',
      phone: '0800000000',
      address: 'HQ',
      role: 'Admin',
      createdAt: '2026-05-28T00:00:00Z'
    }));

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const adminLink = compiled.querySelector('nav a[routerLink="/admin"]');
    expect(adminLink?.textContent?.trim()).toBe('Admin');
  });
});
