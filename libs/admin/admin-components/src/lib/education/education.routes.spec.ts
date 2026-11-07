import { EducationMainComponent } from '@portfolio-v2/portfolio-pages';
import { EDUCATION_ADMIN_ROUTES } from './education.routes';

describe('EDUCATION_ADMIN_ROUTES', () => {
  describe('when the path is the education hub', () => {
    it('should show the public education page', async () => {
      const hub = EDUCATION_ADMIN_ROUTES.find((route) => route.path === '');
      const component = await hub?.loadComponent?.();

      expect(hub?.pathMatch).toBe('full');
      expect(component).toBe(EducationMainComponent);
    });
  });
});
