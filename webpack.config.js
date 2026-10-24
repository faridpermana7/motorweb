import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import fs from 'fs';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { globSync } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const { appendDailyLog } = require('./scripts/daily-log.cjs');
// const pages = globSync('./pages/*.html');

const isDev = process.env.NODE_ENV !== 'production';
const pages = globSync('./pages/sign-in.html');
const devLoggerScript = '<script src="/assets/js/dev-logger.js"></script>';

function injectDevLogger(content) {
  return content.toString().replace(/<head(\s[^>]*)?>/i, (head) => `${head}\n${devLoggerScript}`);
}

// Load SSL certificates for HTTPS support
const certPath = path.join(__dirname, 'certs');
const httpsOptions = {
  key: fs.readFileSync(path.join(certPath, 'key.pem')),
  cert: fs.readFileSync(path.join(certPath, 'cert.pem')),
};

export default {
  mode: isDev ? 'development' : 'production',
  entry: {
    app: './assets/js/app.js',
    bootstrap: './assets/js/bootstrap.js',
    dashboard: './assets/js/dashboard.js',
    signin: './assets/js/master/sign-in.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'assets/js/[name].[contenthash:8].js',
    chunkFilename: 'assets/js/[name].[contenthash:8].chunk.js',
    clean: true,
    publicPath: '/',
  },
  devtool: isDev ? 'source-map' : false,
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            cacheDirectory: true,
          },
        },
      },
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.scss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name].[hash:8][ext]',
        },
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8kb
          },
        },
        generator: {
          filename: 'assets/img/[name].[hash:8][ext]',
        },
      },
      {
        test: /\.json$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/js/[name][ext]',
        },
      },
    ],
  },
  plugins: [ 
    new MiniCssExtractPlugin({
      filename: 'assets/css/[name].[contenthash:8].css',
      chunkFilename: 'assets/css/[name].[contenthash:8].chunk.css',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'assets/js',
          to: 'assets/js',
          filter: async (resourcePath) => {
            return resourcePath.endsWith('.js') || resourcePath.endsWith('.json');
          },
        },
        {
          from: 'pages',
          to: 'pages',
          globOptions: {
            ignore: ['**/sign-in.html'],
          },
          ...(isDev ? { transform: (content) => injectDevLogger(content) } : {}),
        },
        {
          from: 'assets/css',
          to: 'assets/css',
          filter: async (resourcePath) => {
            return resourcePath.endsWith('.css');
          },
        },
        {
          from: 'assets/img',
          to: 'assets/img',
          noErrorOnMissing: true,
        },
        {
          from: 'index.html',
          to: 'index.html',
          noErrorOnMissing: true,
          ...(isDev ? { transform: (content) => injectDevLogger(content) } : {}),
        },
        ...(!isDev ? [
          {
            from: 'node_modules/jquery/dist',
            to: 'node_modules/jquery/dist',
          },
          {
            from: 'node_modules/select2/dist',
            to: 'node_modules/select2/dist',
          },
          {
            from: 'node_modules/@fontsource/inter',
            to: 'node_modules/@fontsource/inter',
          },
          {
            from: 'node_modules/font-awesome',
            to: 'node_modules/font-awesome',
          },
          {
            from: 'node_modules/material-symbols/index.css',
            to: 'node_modules/material-symbols/index.css',
          },
          {
            from: 'node_modules/material-symbols/material-symbols-rounded.woff2',
            to: 'node_modules/material-symbols/material-symbols-rounded.woff2',
          },
          {
            from: 'node_modules/datatables.net-dt',
            to: 'node_modules/datatables.net-dt/',
          },
          {
            from: 'node_modules/datatables.net',
            to: 'node_modules/datatables.net/',
          },
          {
            from: 'node_modules/github-buttons/dist',
            to: 'node_modules/github-buttons/dist',
          },
        ] : []),
        // HTML pages are emitted by HtmlWebpackPlugin; copying them here causes
        // duplicate output filenames such as pages/sign-in.html. Production
        // copies the other source pages and their static runtime dependencies.
      ],
    }),
    ...pages.map(file => {
      const name = path.basename(file, '.html');
      return new HtmlWebpackPlugin({
        template: file,
        filename: `pages/${name}.html`,
        chunks: isDev ? [] : ['signin'],
        inject: 'body',
        templateParameters: { isDev },    // expose to template
        minify: isDev ? false : {
          collapseWhitespace: true,
          removeComments: true,
        },
      });
    }),
  ],
  optimization: {
    minimize: !isDev,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: false,
          },
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
            },
          ],
        },
      }),
    ],
    runtimeChunk: false,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
          enforce: true,
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
          enforce: true,
        },
      },
    },
  },
  resolve: {
    extensions: ['.js', '.json', '.css', '.scss'],
    alias: {
      '@utils': path.resolve(__dirname, 'assets/js/utils/'),
      '@admin': path.resolve(__dirname, 'assets/js/admin/'),
      '@master': path.resolve(__dirname, 'assets/js/master/'),
      '@transaction': path.resolve(__dirname, 'assets/js/transaction/'),
      '@core': path.resolve(__dirname, 'assets/js/core/'),
      '@plugins': path.resolve(__dirname, 'assets/js/plugins/'),
    },
  },
  devServer: {
    setupMiddlewares(middlewares) {
      middlewares.unshift({
        name: 'browser-log-ingest',
        middleware(req, res, next) {
          if (req.url.split('?')[0] !== '/__dev-logs') {
            next();
            return;
          }

          res.setHeader('Content-Type', 'application/json');
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'POST required' }));
            return;
          }

          const chunks = [];
          let size = 0;
          let tooLarge = false;
          req.on('data', (chunk) => {
            size += chunk.length;
            if (size > 64 * 1024) {
              tooLarge = true;
            } else {
              chunks.push(chunk);
            }
          });
          req.on('end', () => {
            if (tooLarge) {
              res.statusCode = 413;
              res.end(JSON.stringify({ error: 'Log batch too large' }));
              return;
            }

            let payload;
            try {
              payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
              return;
            }

            if (!payload || !Array.isArray(payload.logs) || payload.logs.length > 25) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Expected up to 25 log entries' }));
              return;
            }

            const validLevels = new Set(['INFO', 'WARN', 'ERROR']);
            const validLogs = payload.logs.every((entry) => (
              entry
              && validLevels.has(entry.level)
              && typeof entry.message === 'string'
              && entry.message.length <= 4096
              && typeof entry.page === 'string'
              && entry.page.length <= 512
            ));
            if (!validLogs) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid log entry' }));
              return;
            }

            try {
              payload.logs.forEach((entry) => {
                appendDailyLog(entry.level, `BROWSER ${entry.page}: ${entry.message}`);
              });
            } catch (error) {
              console.error(`Unable to append browser logs: ${error.message}`);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Unable to write logs' }));
              return;
            }

            res.statusCode = 204;
            res.end();
          });
        },
      });
      return middlewares;
    },
    static: [
      {
        directory: path.join(__dirname, '.'),
        publicPath: '/',
      },
      {
        directory: path.join(__dirname, 'pages'),
        publicPath: '/',
      },
    ],
    server: {
      type: 'https',
      options: httpsOptions,
    },
    compress: true,
    host: process.env.HOST || 'localhost',
    port: Number(process.env.PORT || 8081),
    allowedHosts: ['motor.web', '127.0.0.1', 'localhost', '0.0.0.0'],
    open: false,
    hot: true,
    historyApiFallback: {
      rewrites: [
        { from: /^\/pages\//, to: '/pages/index.html' },
        { from: /./, to: '/pages/sign-in.html' },
      ],
    },
  },
  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
    hints: !isDev ? 'warning' : false,
  },
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '.webpack_cache'),
  },
};
