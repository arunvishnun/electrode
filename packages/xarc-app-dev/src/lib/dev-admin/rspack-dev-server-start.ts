import { RspackOptions, OptimizationSplitChunksOptions, rspack } from '@rspack/core';
import { RspackDevServer } from '@rspack/dev-server';
import path from 'path';
import HtmlRspackPlugin from 'html-rspack-plugin';
import compression from 'compression';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

// Resolve paths relative to the application root directory
const appRoot = process.cwd();

// export default function customMiddleware(req, res, next) {
//   if (req.url === '/') {
//     const htmlPath = path.resolve(process.cwd(), 'dist', 'index.html');
//     res.sendFile(htmlPath);
//   } else {
//     next();
//   }
// }

export default function customMiddleware(req, res, next) {
  const bundleFilename = "main.[contenthash].js"
  if (req.url === '/') {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rspack App</title>
      </head>
      <body>
        <div id="root"></div>
        <script src="/main.js"></script>
      </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  } else {
    next();
  }
}

const config = {
  entry: {
    index: path.resolve(appRoot, './src/app.tsx'),
  },
  output: {
    path: path.resolve(appRoot, 'dist'),
    filename: 'bundle.[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
  },
  resolve: {
    roots: [path.resolve(appRoot, 'src')],
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    mainFiles: ['index', 'app'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
            },
          },
        },
        type: 'javascript/auto',
      },
      {
        test: /\.tsx$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
            },
          },
        },
        type: 'javascript/auto',
      },
      {
        test: /\.jsx$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'ecmascript',
                jsx: true,
              },
              transform: {
                react: {
                  pragma: 'React.createElement',
                  pragmaFrag: 'React.Fragment',
                  throwIfNamespace: true,
                  development: false,
                  useBuiltins: false,
                },
              },
            },
          },
        },
        type: 'javascript/auto',
      },
      {
        test: /\.js$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            // some options
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                // ...
              },
            },
          },
        ],
        type: 'css/auto',
      },
      {
        test: /\.(sass|scss)$/,
        use: [
          {
            loader: 'sass-loader',
            options: {
              // ...
            },
          },
        ],
        type: 'css/auto',
      },
      {
        test: /\.svg$/,
        oneOf: [
          {
            resourceQuery: /component/,
            use: [
              {
                loader: '@svgr/webpack',
                options: {
                  // Add any @svgr/webpack specific options here
                },
              },
            ],
          },
          {
            type: 'asset',
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024,
          },
        },
        generator: {
          filename: 'static/media/[name].[hash:8][ext]',
        },
      },
    ],
  },
  optimization: {
    runtimeChunk: true,
    splitChunks: {
      chunks: 'all',
      minChunks: 1,
      minSize: 100,
      maxSize: 230,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        // defaultVendors: {
        //   test: /[\\/]node_modules[\\/]/,
        //   priority: -10,
        //   reuseExistingChunk: true,
        // },
        // default: {
        //   minChunks: 2,
        //   priority: -20,
        //   reuseExistingChunk: true,
        // },
      },
    },
    minimize: true,
    minimizer: [
      // Add minification options here if necessary
    ],
  } as OptimizationSplitChunksOptions,
  plugins: [
    new BundleAnalyzerPlugin(),
    // new HtmlRspackPlugin({
    //   template: '../templates/index.html',
    // }),
    // Other plugins...
  ],
  // mode: process.env.NODE_ENV === 'production' ? "production" : "development",
} as RspackOptions;

const devServerOptions = {
  hot: true,
  open: true,
  setupMiddlewares: (middlewares, devServer) => {
    middlewares.unshift({
      name: 'custom-middleware',
      middleware: customMiddleware,
    });
    middlewares.unshift({
      name: 'compression-middleware',
      middleware: compression(),
    });
    return middlewares;
  },
};

function startDevServer(port = 4000, host = 'localhost') {
  const compiler = rspack(config);
  const server = new RspackDevServer(devServerOptions, compiler);
  
  server.listen(port, host, () => {
    console.log(`Starting server on http://${host}:${port}`);
  });
}


export { startDevServer };