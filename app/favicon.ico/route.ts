const favicon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#425f49"/>
  <path d="M20 18h24v28H20z" fill="#f5f1e8"/>
  <path d="M24 24h16M24 31h16M24 38h10" stroke="#425f49" stroke-width="3" stroke-linecap="round"/>
</svg>`;

export function GET() {
  return new Response(favicon, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
