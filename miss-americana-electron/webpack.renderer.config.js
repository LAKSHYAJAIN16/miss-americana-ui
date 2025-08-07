const path = require('path');
const webpack = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.rules');

const isDevelopment = process.env.NODE_ENV !== 'production';

const rules = [
  ...baseConfig,
  {
    test: /\.(js|jsx)$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env', '@babel/preset-react'],
        plugins: [
          isDevelopment && require.resolve('react-refresh/babel'),
        ].filter(Boolean),
      },
    },
  },
  {
    test: /\.css$/,
    use: [
      'style-loader',
      'css-loader',
      'postcss-loader',
    ],
  },
  {
    test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf|otf)$/,
    type: 'asset/resource',
  },
];

const config = {
  mode: isDevelopment ? 'development' : 'production',
  devtool: isDevelopment ? 'inline-source-map' : 'source-map',
  target: 'electron-renderer',
  entry: './src/renderer/index.jsx',
  output: {
    path: path.resolve(__dirname, '.webpack/renderer'),
    filename: 'index.js',
  },
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
    },
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
      DEBUG_PROD: false,
    }),
    isDevelopment && new webpack.HotModuleReplacementPlugin(),
    isDevelopment && new ReactRefreshWebpackPlugin(),
  ].filter(Boolean),
};

module.exports = merge(config, {
  // Add any additional webpack config here
});
