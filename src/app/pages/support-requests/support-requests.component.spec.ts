import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportRequestsComponent } from './support-requests.component';

describe('SupportRequestsComponent', () => {
  let component: SupportRequestsComponent;
  let fixture: ComponentFixture<SupportRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportRequestsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SupportRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
