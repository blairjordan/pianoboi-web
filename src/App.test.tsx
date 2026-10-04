import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import LandingPage from './LandingPage';

describe('landing page', () => {
	test('renders the pianoboi heading and app link', () => {
		render(<LandingPage />);
		expect(screen.getByRole('heading', { level: 1, name: 'pianoboi' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /begin playing/i })).toHaveAttribute('href', '/app');
	});
});
