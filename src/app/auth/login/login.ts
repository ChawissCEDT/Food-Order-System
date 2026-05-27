import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { AuthService } from '../auth.service';

type LoginControl = 'email' | 'password';

@Component({
  selector: 'app-login',
  imports: [Button, Card, InputText, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  submitted = false;
  authError = '';

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  showError(controlName: LoginControl): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted);
  }

  submitLogin(): void {
    this.submitted = true;
    this.authError = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: (result) => {
        if (!result.success) {
          this.authError = result.error ?? 'Login failed.';
          return;
        }
        void this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.authError = err.error?.message ?? err.error?.Message ?? 'Login failed.';
      }
    });
  }

  get returnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl?.startsWith('/') ? returnUrl : '/restaurant';
  }
}
