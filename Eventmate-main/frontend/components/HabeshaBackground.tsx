/**
 * Optional full-page wrapper for pages that need an explicit content stack
 * above the global tilet pattern. Most pages inherit the pattern from
 * `body.habesha-app` in the root layout.
 */
export function HabeshaBackground({ children }: { children: React.ReactNode }) {
  return <div className="habesha-content min-h-screen">{children}</div>;
}
