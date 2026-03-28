import { Directive, Input, TemplateRef, ViewContainerRef, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appConditionalRender]'
})
export class ConditionalRenderDirective implements OnDestroy {
  private hasView = false;
  private timeoutId: any;

  @Input() set appConditionalRender(condition: boolean) {
    if (condition && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!condition && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  @Input() set appConditionalRenderDelay(delay: number) {
    if (delay > 0) {
      this.clearTimeout();
      this.timeoutId = setTimeout(() => {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }, delay);
    }
  }

  @Input() set appConditionalRenderAnimation(animation: string) {
    if (animation && this.hasView) {
      const viewRef = this.viewContainer.get(0);
      if (viewRef) {
        // Animation logic would go here if needed
        console.log('Animation applied:', animation);
      }
    }
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}

  ngOnDestroy() {
    this.clearTimeout();
  }

  private clearTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}