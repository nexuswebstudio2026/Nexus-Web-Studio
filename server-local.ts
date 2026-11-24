import 'dotenv/config';
import { createApp } from './server';

void createApp().then((app) => {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor activo en http://0.0.0.0:${port} (${process.env.NODE_ENV || 'development'})`);
  });
}).catch((error) => {
  console.error('Error iniciando el servidor:', error);
  process.exit(1);
});
