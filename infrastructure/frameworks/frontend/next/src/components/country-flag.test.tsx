import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CountryFlag } from './country-flag';

describe('CountryFlag', () => {
  it('renders known ISO2 as inline SVG host', () => {
    const { container } = render(<CountryFlag iso2="fr" name="France" />);

    expect(container.querySelector('span[class*="inline-flex"]')).toBeTruthy();
    expect(container.querySelector('span[title="FR"]')).toBeTruthy();
    expect(screen.getByText('France')).toBeInTheDocument();
  });

  it('renders raw code when ISO2 is unknown', () => {
    render(<CountryFlag iso2="xx" name="Nowhere" />);

    expect(screen.getByText('xx')).toBeInTheDocument();
    expect(screen.getByText('Nowhere')).toBeInTheDocument();
  });
});
