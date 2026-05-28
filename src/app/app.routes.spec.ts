import { routes } from './app.routes';
import { adminGuard } from './auth/admin.guard';

describe('App routes', () => {
  it('registers the admin dashboard route behind the admin guard', () => {
    const adminRoute = routes.find((route) => route.path === 'admin');

    expect(adminRoute).toBeTruthy();
    expect(adminRoute?.canActivate).toContain(adminGuard);
  });
});
