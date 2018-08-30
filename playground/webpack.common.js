// Copyright 2018 The AMPHTML Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('style-ext-html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const {GenerateSW} = require('workbox-webpack-plugin');
const {InjectManifest} = require('workbox-webpack-plugin');

module.exports = {
  context: path.resolve(__dirname, './src'),
  entry: {
    app: './app.js',
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].[hash].js',
    chunkFilename: '[name].[chunkhash].bundle.js',
    sourceMapFilename: '[name].map',
    publicPath: '', 
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ['es2015'],
            plugins: [ "syntax-dynamic-import"]
          }
        }],
      },
      { 
        test: /^(?!.*\.critical).*\.css$/, 
        use: ['style-loader', 'css-loader'],
      },
      { 
        test: /\.critical\.css$/, 
        loader: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        }),
      },
      {
        test: /^(?!.*\.template).*\.html$/,
        loader: 'html-loader',
      },
      {
        test:   /\.template\.html$/,
        loader: 'html-loader',
        query:  {
          minimize: false
        }
      },
      {
        test: /\.(png|jpg|svg)$/,
        loader: 'url-loader'
      },
      {
        test: /\.hbs$/,
        loader: 'handlebars-loader'
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: '!handlebars-loader!src/index.hbs', 
    }),
    new ScriptExtHtmlWebpackPlugin({
      defaultAttribute: 'async',
      preload: [/app\..*\.js/],
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new CopyWebpackPlugin([
      { from: '../static' }
    ]),
    new ExtractTextPlugin({
      filename: '[name].css',
      allChunks: true,
    }),
    new StyleExtHtmlWebpackPlugin(),
    new InjectManifest({
      globPatterns: ['**\/*.{html,js,css}'],
      globIgnores: ['**\/sw.js'],
      swSrc: './src/sw.js',
      swDest: 'sw.js',
    }),
  ],
  devServer: {
    contentBase: path.resolve(__dirname, './src'),  // New
    historyApiFallback: {
      rewrites: [
        // shows views/landing.html as the landing page
        { from: /^\/amp\/.*$/, to: '/' },
      ],
    }
  },
  devtool: "#inline-source-map"
};
