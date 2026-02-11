import app from './app';
import { config } from './config/env';

const PORT = config.PORT || 3001;

app.listen(PORT, () => {
  console.log(`
🚀 INK.SPIRIT Backend Server
═══════════════════════════════════════
📡 Server running on port: ${PORT}
🌐 Environment: ${config.NODE_ENV}
📊 API Documentation: http://localhost:${PORT}/api/health
═══════════════════════════════════════
  `);
});
