import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function SettingsPage() {
  const { theme, themeName, setTheme, themes } = useTheme();
  const navigate = useNavigate();

  const teacher = JSON.parse(localStorage.getItem('teacher'));

  if (!teacher) {
    navigate('/');
    return null;
  }

  return (
    <div style={{ ...styles.container, background: theme.background, color: theme.text }}>
      <div style={styles.header}>
        <button
          style={{ ...styles.backButton, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text }}
          onClick={() => navigate('/')}
        >
          ← Back to Dashboard
        </button>
        <h1 style={{ margin: 0, fontSize: 24 }}>Settings</h1>
      </div>

      <div style={{ ...styles.card, background: theme.surface, border: `1px solid ${theme.border}` }}>
        <h2 style={{ marginTop: 0, color: theme.text }}>👋 {teacher.name}</h2>
        <p style={{ color: theme.textMuted }}>@{teacher.username}</p>
        {teacher.email && <p style={{ color: theme.textMuted }}>{teacher.email}</p>}
      </div>

      <div style={{ ...styles.card, background: theme.surface, border: `1px solid ${theme.border}` }}>
        <h2 style={{ marginTop: 0, color: theme.text }}>🎨 Theme</h2>
        <div style={styles.themeGrid}>
          {Object.entries(themes).map(([key, t]) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              style={{
                ...styles.themeButton,
                background: t.background,
                border: themeName === key ? `3px solid ${t.primary}` : `2px solid ${t.border}`,
                color: t.text
              }}
            >
              <div style={{ ...styles.themePreview, background: t.surface, border: `1px solid ${t.border}` }}>
                <div style={{ ...styles.previewBar, background: t.primary }} />
                <div style={{ ...styles.previewLine, background: t.text, width: '60%' }} />
                <div style={{ ...styles.previewLine, background: t.textMuted, width: '40%' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: themeName === key ? 700 : 400 }}>
                {themeName === key ? '✓ ' : ''}{t.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: '0 auto',
    padding: 32,
    fontFamily: 'sans-serif',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32
  },
  backButton: {
    padding: '8px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14
  },
  card: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 24
  },
  themeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    marginTop: 16
  },
  themeButton: {
    padding: 12,
    borderRadius: 12,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    transition: 'transform 0.1s'
  },
  themePreview: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    boxSizing: 'border-box'
  },
  previewBar: {
    height: 8,
    borderRadius: 4,
    width: '100%'
  },
  previewLine: {
    height: 6,
    borderRadius: 3
  }
};