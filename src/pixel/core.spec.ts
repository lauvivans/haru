import { afterEach, describe, expect, it, vi } from 'vitest';

// core reads prefers-reduced-motion when the module loads
vi.hoisted(() => vi.stubGlobal('matchMedia', () => ({ matches: true })));

const { to } = await import('@/pixel/core');

describe('to with reduced motion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('jumps to the end state without a tween', () => {
    const target = { hy: 76 };
    const onComplete = vi.fn();

    const tween = to(target, { hy: 54, duration: 0.35, ease: 'back.out(2)', onComplete });

    expect(tween).toBeNull();
    expect(target).toEqual({ hy: 54 });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('leaves a yoyo where it started, so a hit does not leave Haru in the air', () => {
    const target = { hop: 0 };

    to(target, { hop: 4, duration: 0.14, yoyo: true, repeat: 1 });

    expect(target).toEqual({ hop: 0 });
  });
});
