import path from 'path';
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
// const pages = globSync('./pages/*.html');

const isDev = process.env.NODE_ENV !== 'production';
const pages = globSync('./pages/sign-in.html');

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
        },
        ...(!isDev ? [
          {
            from: 'pages',
            to: 'pages',
            globOptions: {
              ignore: ['**/sign-in.html'],
            },
          },
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
