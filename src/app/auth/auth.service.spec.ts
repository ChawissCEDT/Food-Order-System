import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    service = new AuthService();
  });

  it('registers and logs in a new user', () => {
    const result = service.register({
      name: 'Student User',
      email: 'student@example.com',
      phone: '0812345678',
      address: 'Dorm A',
      password: 'secret1'
    });

    expect(result.success).toBe(true);
    expect(service.currentUser()?.email).toBe('student@example.com');
    expect(service.isLoggedIn()).toBe(true);
  });

  it('prevents duplicate email registration', () => {
    const request = {
      name: 'Student User',
      email: 'student@example.com',
      phone: '0812345678',
      address: 'Dorm A',
      password: 'secret1'
    };

    service.register(request);
    const duplicate = service.register(request);

    expect(duplicate.success).toBe(false);
    expect(duplicate.error).toBe('This email is already registered.');
  });

  it('logs out the current user', () => {
    service.register({
      name: 'Student User',
      email: 'student@example.com',
      phone: '0812345678',
      address: 'Dorm A',
      password: 'secret1'
    });

    service.logout();

    expect(service.currentUser()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });
});
