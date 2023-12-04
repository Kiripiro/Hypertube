import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NestedCommentsComponent } from './nested-comments.component';

describe('NestCommentsComponent', () => {
  let component: NestedCommentsComponent;
  let fixture: ComponentFixture<NestedCommentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NestedCommentsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(NestedCommentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
