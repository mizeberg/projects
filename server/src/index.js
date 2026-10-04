import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 8787);
createApp().listen(port, '0.0.0.0', () => {
  console.log(`John AI server listening on http://0.0.0.0:${port}`);
});
