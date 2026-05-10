import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  OnChanges,
  OnDestroy,
  Renderer2,
  inject,
  input,
} from '@angular/core';

/**
 * US-206 — `appDisabledReason` directive.
 *
 * Attaches an explanation to a disabled control so users (and assistive tech)
 * understand why an action is unavailable. Whenever the bound element is
 * disabled, the directive:
 *  - sets `aria-describedby` pointing to a sibling visually-hidden element
 *    that contains the reason (announced by screen readers);
 *  - exposes a native `title` (basic tooltip on hover);
 *  - on focus / pointerenter renders a small floating tooltip with the reason.
 *
 * Usage:
 *   <button [disabled]="!canApply"
 *           [appDisabledReason]="canApply ? '' : 'Complete your profile (CIN+RIB+ICE) to apply'">
 *     Apply
 *   </button>
 */
let uid = 0;

@Directive({
  selector: '[appDisabledReason]',
  standalone: true,
})
export class DisabledReasonDirective implements OnChanges, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  readonly appDisabledReason = input<string>('');

  private readonly describeId = `disabled-reason-${++uid}`;
  private describeEl: HTMLElement | null = null;
  private tooltipEl: HTMLElement | null = null;

  @HostBinding('attr.aria-describedby')
  get ariaDescribedBy(): string | null {
    return this.isActive() ? this.describeId : null;
  }

  @HostBinding('attr.title')
  get nativeTitle(): string | null {
    return this.isActive() ? this.appDisabledReason() : null;
  }

  ngOnChanges(): void {
    this.refreshDescribeNode();
  }

  ngOnDestroy(): void {
    this.removeDescribeNode();
    this.hideTooltip();
  }

  @HostListener('mouseenter')
  @HostListener('focus')
  onShow(): void {
    if (this.isActive()) this.showTooltip();
  }

  @HostListener('mouseleave')
  @HostListener('blur')
  onHide(): void {
    this.hideTooltip();
  }

  private isActive(): boolean {
    const el = this.host.nativeElement as HTMLElement & { disabled?: boolean };
    const disabled = el.hasAttribute('disabled') || el.disabled === true ||
      el.getAttribute('aria-disabled') === 'true';
    return disabled && !!this.appDisabledReason();
  }

  private refreshDescribeNode(): void {
    if (!this.appDisabledReason()) {
      this.removeDescribeNode();
      return;
    }
    if (!this.describeEl) {
      this.describeEl = this.renderer.createElement('span');
      this.renderer.setAttribute(this.describeEl!, 'id', this.describeId);
      this.renderer.setAttribute(this.describeEl!, 'data-testid', 'disabled-reason');
      // sr-only inline styles (no Tailwind class assumption)
      this.renderer.setStyle(this.describeEl!, 'position', 'absolute');
      this.renderer.setStyle(this.describeEl!, 'width', '1px');
      this.renderer.setStyle(this.describeEl!, 'height', '1px');
      this.renderer.setStyle(this.describeEl!, 'overflow', 'hidden');
      this.renderer.setStyle(this.describeEl!, 'clip', 'rect(0 0 0 0)');
      this.renderer.setStyle(this.describeEl!, 'white-space', 'nowrap');
      this.renderer.setStyle(this.describeEl!, 'border', '0');
      const parent = this.host.nativeElement.parentNode;
      if (parent) parent.insertBefore(this.describeEl!, this.host.nativeElement.nextSibling);
    }
    this.renderer.setProperty(this.describeEl!, 'textContent', this.appDisabledReason());
  }

  private removeDescribeNode(): void {
    if (this.describeEl?.parentNode) {
      this.describeEl.parentNode.removeChild(this.describeEl);
    }
    this.describeEl = null;
  }

  private showTooltip(): void {
    if (this.tooltipEl) return;
    const tip = this.renderer.createElement('div') as HTMLElement;
    this.renderer.setAttribute(tip, 'role', 'tooltip');
    this.renderer.setAttribute(tip, 'data-testid', 'disabled-tooltip');
    this.renderer.setProperty(tip, 'textContent', this.appDisabledReason());
    Object.entries({
      position: 'absolute',
      'z-index': '70',
      background: 'var(--bg-overlay, #111827)',
      color: 'var(--text-primary, #fff)',
      padding: '0.375rem 0.625rem',
      'border-radius': '0.375rem',
      'font-size': '0.75rem',
      'max-width': '260px',
      'pointer-events': 'none',
      'box-shadow': '0 4px 16px rgba(0,0,0,0.4)',
    }).forEach(([k, v]) => this.renderer.setStyle(tip, k, v));

    const rect = this.host.nativeElement.getBoundingClientRect();
    this.renderer.setStyle(tip, 'top', `${window.scrollY + rect.top - 8}px`);
    this.renderer.setStyle(tip, 'left', `${window.scrollX + rect.left + rect.width / 2}px`);
    this.renderer.setStyle(tip, 'transform', 'translate(-50%, -100%)');
    this.renderer.appendChild(document.body, tip);
    this.tooltipEl = tip;
  }

  private hideTooltip(): void {
    if (this.tooltipEl?.parentNode) {
      this.tooltipEl.parentNode.removeChild(this.tooltipEl);
    }
    this.tooltipEl = null;
  }
}
