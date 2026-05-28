import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('stores the current user after registration succeeds', async () => {
    const registeredUser = {
      id: 1,
      name: 'Student User',
      email: 'student@example.com',
      phone: '0812345678',
      address: 'Dorm A',
      role: 'Customer',
      createdAt: '2026-05-28T00:00:00Z'
    };

    const resultPromise = firstValueFrom(service.register({
      name: registeredUser.name,
      email: registeredUser.email,
      phone: registeredUser.phone,
      address: registeredUser.address,
      password: 'secret1'
    }));
    const request = httpMock.expectOne('http://localhost:5146/api/users/register');
    expect(request.request.method).toBe('POST');
    request.flush(registeredUser);

    const result = await resultPromise;
    expect(result.success).toBe(true);
    expect(service.currentUser()?.email).toBe('student@example.com');
    expect(service.isLoggedIn()).toBe(true);
  });

  it('surfaces registration API errors', async () => {
    const request = {
      name: 'Student User',
      email: 'student@example.com',
      phone: '0812345678',
      address: 'Dorm A',
      password: 'secret1'
    };

    const resultPromise = firstValueFrom(service.register(request));
    const httpRequest = httpMock.expectOne('http://localhost:5146/api/users/register');
    httpRequest.flush(
      { Message: 'This email is already registered.' },
      { status: 400, statusText: 'Bad Request' }
    );

    const result = await resultPromise;
    expect(result.success).toBe(false);
    expect(result.error).toBe('This email is already registered.');
  });

  it('logs out the current user', async () => {
    const loggedInUser = {
      id: 1,
      name: 'Stored User',
      email: 'student@example.com',
      phone: '0812345678',
      address: 'Dorm A',
      role: 'Customer',
      createdAt: '2026-05-28T00:00:00Z'
    };

    const resultPromise = firstValueFrom(service.login({
      email: loggedInUser.email,
      password: 'secret1'
    }));
    const request = httpMock.expectOne('http://localhost:5146/api/users/login');
    request.flush(loggedInUser);
    await resultPromise;

    service.logout();

    expect(service.currentUser()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });
});
