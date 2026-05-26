import { Injectable, computed, signal } from '@angular/core';

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

interface StoredUserRecord extends AuthUserResponseDto {
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly usersKey = 'food-order-users';
  private readonly sessionKey = 'food-order-current-user';
  private readonly currentUserSignal = signal<AuthUserResponseDto | null>(this.loadCurrentUser());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUserSignal() !== null);

  register(request: RegisterRequestDto): AuthResult {
    const users = this.readUsers();
    const email = request.email.trim().toLowerCase();
    const existingUser = users.find((user) => user.email.toLowerCase() === email);

    if (existingUser) {
      return { success: false, error: 'This email is already registered.' };
    }

    const user: StoredUserRecord = {
      id: Date.now(),
      name: request.name.trim(),
      email,
      phone: request.phone.trim(),
      address: request.address.trim(),
      password: request.password,
      createdAt: new Date().toISOString()
    };

    this.writeUsers([...users, user]);
    this.setCurrentUser(this.toResponseDto(user));

    return { success: true, user: this.currentUserSignal() ?? undefined };
  }

  login(request: LoginRequestDto): AuthResult {
    const email = request.email.trim().toLowerCase();
    const user = this.readUsers().find(
      (currentUser) => currentUser.email.toLowerCase() === email && currentUser.password === request.password
    );

    if (!user) {
      return { success: false, error: 'Email or password is incorrect.' };
    }

    this.setCurrentUser(this.toResponseDto(user));

    return { success: true, user: this.currentUserSignal() ?? undefined };
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

  private readUsers(): StoredUserRecord[] {
    if (!this.hasStorage()) {
      return [];
    }

    try {
      return JSON.parse(localStorage.getItem(this.usersKey) ?? '[]') as StoredUserRecord[];
    } catch {
      return [];
    }
  }

  private writeUsers(users: StoredUserRecord[]): void {
    if (this.hasStorage()) {
      localStorage.setItem(this.usersKey, JSON.stringify(users));
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

  private toResponseDto(user: StoredUserRecord): AuthUserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt
    };
  }

  private hasStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }
}
