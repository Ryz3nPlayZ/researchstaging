import React from 'react';
import './App.css';

/**
 * App component - Design System Verification
 *
 * This component verifies that design tokens are properly loaded
 * and accessible for component styling.
 */
function App() {
  return (
    <div style={{ minHeight: '100vh', padding: 'var(--spacing-lg)' }}>
      <header style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h1
          style={{
            color: 'var(--color-primary)',
            fontFamily: 'var(--font-family)',
            fontSize: 'var(--font-size-h1)',
            fontWeight: 'var(--font-weight-bold)',
            lineHeight: 'var(--line-height-tight)',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          Research Orchestration Platform
        </h1>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-body)',
          }}
        >
          Design System Foundation
        </p>
      </header>

      <main>
        <section
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            padding: 'var(--spacing-lg)',
            marginBottom: 'var(--spacing-xl)',
          }}
        >
          <h2
            style={{
              color: 'var(--color-primary)',
              fontSize: 'var(--font-size-h2)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            Design Tokens Verification
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
            CSS custom properties are loaded and accessible for component styling.
          </p>

          {/* Status Colors Test */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
            <div
              style={{
                backgroundColor: 'var(--color-success-bg)',
                border: '2px solid var(--color-success)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md)',
              }}
            >
              <strong style={{ color: 'var(--color-success)' }}>Success</strong>
              <p style={{ fontSize: 'var(--font-size-small)' }}>Completed tasks</p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-ready-bg)',
                border: '2px solid var(--color-ready)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md)',
              }}
            >
              <strong style={{ color: 'var(--color-ready)' }}>Ready</strong>
              <p style={{ fontSize: 'var(--font-size-small)' }}>Ready to run</p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-blocked-bg)',
                border: '2px solid var(--color-blocked)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md)',
              }}
            >
              <strong style={{ color: 'var(--color-blocked)' }}>Blocked</strong>
              <p style={{ fontSize: 'var(--font-size-small)' }}>Blocked tasks</p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-warning-bg)',
                border: '2px solid var(--color-warning)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md)',
              }}
            >
              <strong style={{ color: 'var(--color-warning)' }}>Warning</strong>
              <p style={{ fontSize: 'var(--font-size-small)' }}>Needs attention</p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-error-bg)',
                border: '2px solid var(--color-error)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md)',
              }}
            >
              <strong style={{ color: 'var(--color-error)' }}>Error</strong>
              <p style={{ fontSize: 'var(--font-size-small)' }}>Failed tasks</p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-info-bg)',
                border: '2px solid var(--color-info)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md)',
              }}
            >
              <strong style={{ color: 'var(--color-info)' }}>Info</strong>
              <p style={{ fontSize: 'var(--font-size-small)' }}>Information</p>
            </div>
          </div>
        </section>

        {/* Typography Test */}
        <section
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: 'var(--spacing-lg)',
          }}
        >
          <h2
            style={{ fontSize: 'var(--font-size-h2)', color: 'var(--color-primary)', marginBottom: 'var(--spacing-md)' }}
          >
            Typography Scale
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <div style={{ fontSize: 'var(--font-size-display)', color: 'var(--color-primary)' }}>
              Display Text (48px)
            </div>
            <div style={{ fontSize: 'var(--font-size-h1)', color: 'var(--color-primary)' }}>
              Heading 1 (32px)
            </div>
            <div style={{ fontSize: 'var(--font-size-h2)', color: 'var(--color-primary)' }}>
              Heading 2 (24px)
            </div>
            <div style={{ fontSize: 'var(--font-size-h3)', color: 'var(--color-primary)' }}>
              Heading 3 (18px)
            </div>
            <div style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-primary)' }}>
              Body text (16px) - The quick brown fox jumps over the lazy dog.
            </div>
            <div style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)' }}>
              Small text (14px) - Used for metadata and captions.
            </div>
            <div style={{ fontSize: 'var(--font-size-x-small)', color: 'var(--color-text-tertiary)' }}>
              X-Small text (12px) - Fine print and disclaimers.
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-mono)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-family-mono)',
              }}
            >
              <code>const codeText = 'JetBrains Mono (14px)';</code>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
