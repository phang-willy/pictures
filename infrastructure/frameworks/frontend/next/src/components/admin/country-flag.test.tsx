import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ContryFlag } from './country-flag';

describe('ContryFlag', () => {
  it('renders known ISO2 as inline SVG host', () => {
    const { container } = render(<ContryFlag iso2="fr" name="France" />);

    expect(container.querySelector('span[class*="inline-flex"]')).toBeTruthy();
    expect(container.querySelector('span[title="FR"]')).toBeTruthy();
    expect(screen.getByText('France')).toBeInTheDocument();
  });

  it('renders raw code when ISO2 is unknown', () => {
    render(<ContryFlag iso2="xx" name="Nowhere" />);

    expect(screen.getByText('xx')).toBeInTheDocument();
    expect(screen.getByText('Nowhere')).toBeInTheDocument();
  });
});
