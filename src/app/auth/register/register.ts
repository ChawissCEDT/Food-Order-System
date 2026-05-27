import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { AuthService } from '../auth.service';

type RegisterControl = 'name' | 'email' | 'phone' | 'address' | 'password' | 'confirmPassword';

@Component({
  selector: 'app-register',
  imports: [Button, Card, InputText, ReactiveFormsModule, RouterLink, Textarea],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  submitted = false;
  passwordMismatch = false;
  authError = signal('');

  readonly registerForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(9)]],
    address: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  showError(controlName: RegisterControl): boolean {
    const control = this.registerForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted);
  }

  submitRegister(): void {
    this.submitted = true;
    this.authError.set('');
    this.passwordMismatch =
      this.registerForm.controls.password.value !== this.registerForm.controls.confirmPassword.value;

    if (this.registerForm.invalid || this.passwordMismatch) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { confirmPassword, ...request } = this.registerForm.getRawValue();
    this.authService.register(request).subscribe({
      next: (result) => {
        if (!result.success) {
          this.authError.set(result.error ?? 'Register failed.');
          return;
        }
        void this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.authError.set(err.error?.message ?? err.error?.Message ?? 'Register failed.');
      }
    });
  }

  get returnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl?.startsWith('/') ? returnUrl : '/restaurant';
  }
}
