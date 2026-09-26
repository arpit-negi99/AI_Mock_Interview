// Run before the page paints, while respecting the server's script-src policy.
try {
  const theme = localStorage.getItem('interviewai-theme');
  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
} catch {
  // Storage may be unavailable in privacy-restricted browsers.
}
