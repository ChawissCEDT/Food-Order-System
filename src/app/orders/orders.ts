import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Divider } from 'primeng/divider';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { AuthService } from '../auth/auth.service';
import { FoodOrderRecord, FoodOrderService, MenuItemRecord } from '../food-order.service';

type DeliveryControl = 'customerName' | 'phone' | 'address' | 'note';

@Component({
  selector: 'app-orders',
  imports: [Button, Card, Divider, InputText, ReactiveFormsModule, RouterLink, Tag, Textarea, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class Orders {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly orderService = inject(FoodOrderService);

  submitted = false;
  lastOrder: FoodOrderRecord | null = null;

  readonly deliveryForm = this.formBuilder.nonNullable.group({
    customerName: ['', Validators.required],
    phone: ['', [Validators.required, Validators.minLength(9)]],
    address: ['', Validators.required],
    note: ['']
  });

  constructor() {
    const user = this.authService.currentUser();

    if (user) {
      this.deliveryForm.patchValue({
        customerName: user.name,
        phone: user.phone,
        address: user.address
      });
    }
  }

  get cartLines() {
    return this.orderService.getCartLines();
  }

  get orders() {
    return this.orderService.getOrders();
  }

  addItem(item: MenuItemRecord): void {
    this.orderService.addToCart(item);
  }

  removeItem(item: MenuItemRecord): void {
    this.orderService.removeFromCart(item.id);
  }

  showError(controlName: DeliveryControl): boolean {
    const control = this.deliveryForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted);
  }

  submitOrder(): void {
    this.submitted = true;
    const user = this.authService.currentUser();

    if (!user) {
      void this.router.navigateByUrl('/login');
      return;
    }

    if (this.cartLines.length === 0 || this.deliveryForm.invalid) {
      this.deliveryForm.markAllAsTouched();
      return;
    }

    this.orderService.createOrder({
      ...this.deliveryForm.getRawValue(),
      userId: user.id
    }).subscribe({
      next: (order) => {
        this.lastOrder = order;
        this.deliveryForm.reset({
          customerName: '',
          phone: '',
          address: '',
          note: ''
        });
        this.submitted = false;
      },
      error: (err) => {
        console.error('Checkout failed', err);
      }
    });
  }

  cancelOrder(orderId: number): void {
    this.orderService.cancelOrder(orderId);
  }

  editingOrderId: number | null = null;
  editAddress = '';
  editNote = '';

  startEdit(order: FoodOrderRecord): void {
    this.editingOrderId = order.id;
    this.editAddress = order.address;
    this.editNote = order.note ?? '';
  }

  cancelEdit(): void {
    this.editingOrderId = null;
  }

  saveEdit(orderId: number): void {
    this.orderService.updateOrder(orderId, this.editAddress, this.editNote).subscribe({
      next: () => {
        this.editingOrderId = null;
      },
      error: (err) => console.error('Failed to update order', err)
    });
  }
}
