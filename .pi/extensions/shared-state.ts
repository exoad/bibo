// Shared state between extensions in the same session.
// Extensions can set flags here and read flags from other extensions.
// This is a simple module-level object — safe because extensions
// share a module scope within a session.

export const state = {
  /** Set by quality-monitor when a correction is sent. Read by skill-inject. */
  correctionSent: false,
};
