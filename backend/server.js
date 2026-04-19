const net = require('net');
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

async function findFreePort(startPort = 5000) {
  const envPort = process.env.PORT;
  if (envPort) {
    return Number(envPort);
  }
  for (let port = startPort; port < startPort + 101; port++) {
    const testerServer = net.createServer();
    testerServer.listen(port);
    try {
      await new Promise((resolve, reject) => {
        testerServer.once('listening', () => resolve(port));
        testerServer.once('error', (err) => reject(err));
      });
      testerServer.close();
      return port;
    } catch (err) {
      testerServer.close();
      if (err.code !== 'EADDRINUSE') {
        throw err;
      }
    }
  }
  throw new Error('No free port found in range 5000-5100');
}

const startServer = async () => {
  try {
    await connectDB();

    const actualPort = await findFreePort();
    app.listen(actualPort, () => {
      console.log(`🚀 FuelSense Backend running on port ${actualPort}`);
      console.log(`🌐 Health check: http://localhost:${actualPort}/health`);
    });

  } catch (error) {
    console.error("❌ Server Startup Error:", error.message);
    process.exit(1);
  }
};

startServer();
