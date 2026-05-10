import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * US-018 — `/auth/register/business` is a thin redirect to `/auth/onboard?type=…`.
 * The full Account Information + Business Information form lives on `OnboardPage`,
 * shared by the 3 business-style roles routed from `/auth/register`.
 */
@Component({
  selector: 'app-register-business-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p class="sr-only">Redirecting…</p>`,
})
export class RegisterBusinessPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const requested = this.route.snapshot.queryParamMap.get('type');
    const type =
      requested === 'agency' || requested === 'small_business' || requested === 'brand'
        ? requested
        : 'brand';
    void this.router.navigate(['/auth/onboard'], { queryParams: { type } });
  }
}
