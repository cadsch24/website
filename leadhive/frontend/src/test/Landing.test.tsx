import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect } from 'vitest';
import Landing from '../pages/Landing';

describe('Landing Component', () => {
  test('renders LeadHive branding title', () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );
    // There are multiple instances of LeadHive (brand name, footer, etc.)
    const brandingElements = screen.getAllByText('LeadHive');
    expect(brandingElements.length).toBeGreaterThan(0);
  });

  test('renders CTA button', () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );
    expect(screen.getByText('Launch Dashboard')).toBeInTheDocument();
  });
});
