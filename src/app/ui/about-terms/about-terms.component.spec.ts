import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutTermsComponent } from './about-terms.component';

describe('AboutTermsComponent', () => {
  let component: AboutTermsComponent;
  let fixture: ComponentFixture<AboutTermsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutTermsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AboutTermsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
