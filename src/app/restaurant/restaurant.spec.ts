import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { Restaurant } from './restaurant';

describe('Restaurant', () => {
  let component: Restaurant;
  let fixture: ComponentFixture<Restaurant>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Restaurant],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({})
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Restaurant);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render restaurant list', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Choose a restaurant');
    expect(compiled.textContent).toContain('Siam Street Kitchen');
  });
});
