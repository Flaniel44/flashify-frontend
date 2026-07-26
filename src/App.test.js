import { render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function ThemeName() {
  const { themeName } = useTheme();
  return <span>{themeName}</span>;
}

test('uses the plain theme by default', () => {
  localStorage.removeItem('flashify_theme');

  render(
    <ThemeProvider>
      <ThemeName />
    </ThemeProvider>
  );

  expect(screen.getByText('plain')).toBeInTheDocument();
});
