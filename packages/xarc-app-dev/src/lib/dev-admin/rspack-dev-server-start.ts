const rspack = require('@rspack/core');
const RspackDevServer = require('@rspack/dev-server');
const path = require('path');

const config = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  // Add your Rspack configurations here
};

const devServerOptions = {
  contentBase: path.resolve(__dirname, 'dist'),
  hot: true,
  open: true,
  // Add your dev server configurations here
};

function start(port = 3000, host = 'localhost') {
  const compiler = rspack(config);
  const server = new RspackDevServer(compiler, devServerOptions);

  server.listen(port, host, () => {
    console.log(`Starting server on http://${host}:${port}`);
  });
}

module.exports = { start };
