if (!import.meta.env.VITE_API_KEY) {
  console.warn(
    '⚠️ VITE_API_KEY is not set. Translation API calls will fail. Copy .env.example to .env and set VITE_API_KEY.',
  );
  console.warn(
    'Example .env.local for dev (npm run dev): VITE_API_URL=http://127.0.0.1:8000 / VITE_API_KEY=<the key configured in translator-api>',
  );
  console.warn(
    'Note: VITE_API_URL can be empty for production behind nginx; for \'npm run dev\' set it to your local translator-api URL.',
  );
}
