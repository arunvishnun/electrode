import { rspack } from '@rspack/core';
// import type { SwcLoaderOptions } from '@rspack/core';
import { RspackDevServer } from '@rspack/dev-server';
// import type { Configuration } from '@rspack/dev-server';
import path from 'path';

const config = {
  entry: './src/app.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  resolve: {
    roots: ['src'],
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
        type: 'css/auto', // set to 'css/auto' if you want to support '*.module.css' as CSS Module, otherwise set type to 'css'
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
        type: 'css/auto', // set to 'css/auto' if you want to support '*.module.(scss|sass)' as CSS Module, otherwise set type to 'css'
      },
      {
        test: /\.svg$/,
        oneOf: [
          // Use @svgr/webpack to handle SVG files as React components
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
          // Default handling for SVG files
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
            maxSize: 8 * 1024, // Inline files smaller than 8KB
          },
        },
        generator: {
          filename: 'static/media/[name].[hash:8][ext]',
        },
      },
    ],
  },
  // Add more Rspack configurations here
};

const devServerOptions = {
  hot: true,
  open: true,
  
  // Add your dev server configurations here
};

function start(port = 3000, host = 'localhost') {
  const compiler = rspack(config);
  const server = new RspackDevServer(devServerOptions, compiler);

  server.listen(port, host, () => {
    console.log(`Starting server on http://${host}:${port}`);
    // process.send({
    //   name: "webpack-report",
    //   port,
    //   valid: false
    // });
  });
}

export { start };
