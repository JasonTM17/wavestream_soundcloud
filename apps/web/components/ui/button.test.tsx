'use client';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Button } from './button';

afterEach(() => {
  cleanup();
});

describe('Button', () => {
  it.each([
    ['default', 'bg-primary text-primary-foreground'],
    [
      'secondary',
      'border border-border bg-muted text-foreground hover:bg-accent hover:scale-[1.02]',
    ],
    [
      'outline',
      'border border-border bg-transparent text-foreground hover:border-primary hover:bg-muted/50 hover:scale-[1.02]',
    ],
    ['ghost', 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'],
    ['accent', 'bg-primary text-primary-foreground font-bold hover:scale-[1.02]'],
  ] as const)('applies the %s variant classes', (variant, expectedClass) => {
    render(<Button variant={variant}>WaveStream CTA</Button>);

    expect(screen.getByRole('button', { name: 'WaveStream CTA' })).toHaveClass(expectedClass);
  });

  it('forwards CTA styling through asChild links', () => {
    render(
      <Button asChild variant="outline" size="lg" className="rounded-full px-6">
        <a href="/discover">Explore discovery</a>
      </Button>,
    );

    const cta = screen.getByRole('link', { name: 'Explore discovery' });

    expect(cta).toHaveAttribute('href', '/discover');
    expect(cta).toHaveClass(
      'border border-border bg-transparent text-foreground hover:border-primary hover:bg-muted/50 hover:scale-[1.02]',
    );
    expect(cta).toHaveClass('rounded-full px-6');
  });

  it.each(['secondary', 'outline', 'ghost'] as const)(
    'keeps the %s variant on semantic colors',
    (variant) => {
      render(<Button variant={variant}>Semantic button</Button>);

      const button = screen.getByRole('button', { name: 'Semantic button' });

      expect(button.className).not.toContain('text-white');
      expect(button.className).not.toContain('border-[#727272]');
    },
  );

  it('keeps disabled buttons non-interactive', () => {
    render(<Button disabled>Start free</Button>);

    const cta = screen.getByRole('button', { name: 'Start free' });

    expect(cta).toBeDisabled();
    expect(cta).toHaveClass('disabled:pointer-events-none');
    expect(cta).toHaveClass('disabled:opacity-50');
  });
});
