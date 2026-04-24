import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MapHistory } from './map-history';

describe('MapHistory', () => {
  it('opens panel and shows Monde entry', async () => {
    const user = userEvent.setup();
    render(
      <MapHistory
        selectedContinentName={null}
        selectedCountryName={null}
        selectedCountryIso2={null}
        selectedCityName={null}
        selectedPostName={null}
        onFocusWorld={vi.fn()}
        onFocusContinent={vi.fn()}
        onFocusCountry={vi.fn()}
        onFocusCity={vi.fn()}
        onFocusPost={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /historique/i }));

    expect(screen.getByRole('button', { name: /monde/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/réduire l'historique/i)).toBeInTheDocument();
  });
});
