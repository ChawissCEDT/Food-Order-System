import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

export interface AuthUserResponseDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RegisterRequestDto {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUserResponseDto;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5146/api/users';
  private readonly sessionKey = 'food-order-current-user';
  private readonly currentUserSignal = signal<AuthUserResponseDto | null>(this.loadCurrentUser());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUserSignal() !== null);

  register(request: RegisterRequestDto): Observable<AuthResult> {
    return this.http.post<AuthUserResponseDto>(`${this.apiUrl}/register`, request).pipe(
      map((user) => {
        this.setCurrentUser(user);
        return { success: true, user };
      }),
      catchError((err) => {
        const errorMsg = err.error?.message ?? err.error?.Message ?? 'Registration failed.';
        return of({ success: false, error: errorMsg });
      })
    );
  }

  login(request: LoginRequestDto): Observable<AuthResult> {
    return this.http.post<AuthUserResponseDto>(`${this.apiUrl}/login`, request).pipe(
      map((user) => {
        this.setCurrentUser(user);
        return { success: true, user };
      }),
      catchError((err) => {
        const errorMsg = err.error?.message ?? err.error?.Message ?? 'Email or password is incorrect.';
        return of({ success: false, error: errorMsg });
      })
    );
  }

  logout(): void {
    this.currentUserSignal.set(null);

    if (this.hasStorage()) {
      localStorage.removeItem(this.sessionKey);
    }
  }

  private setCurrentUser(user: AuthUserResponseDto): void {
    this.currentUserSignal.set(user);

    if (this.hasStorage()) {
      localStorage.setItem(this.sessionKey, JSON.stringify(user));
    }
  }

  private loadCurrentUser(): AuthUserResponseDto | null {
    if (!this.hasStorage()) {
      return null;
    }

    try {
      return JSON.parse(localStorage.getItem(this.sessionKey) ?? 'null') as AuthUserResponseDto | null;
    } catch {
      return null;
    }
  }

  private hasStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }
}
