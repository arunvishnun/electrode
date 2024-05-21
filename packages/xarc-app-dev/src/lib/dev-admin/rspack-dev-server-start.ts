const rspack = require('@rspack/core');
const { startDevServer } = require('@rspack/cli');
const path = require('path');

const config = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  // Add your Rspack configurations here
};

async function start(port = 3000, host = 'localhost') {
  const compiler = rspack(config);
  
  const devServerOptions = {
    port,
    host,
    hot: true,
    open: true,
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    // Add your dev server configurations here
  };
  
  const server = await startDevServer(compiler, devServerOptions);
  
  server.listen(port, host, () => {
    console.log(`Starting server on http://${host}:${port}`);
  });
}

module.exports = { start };
