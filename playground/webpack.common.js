const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('style-ext-html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const WorkboxBuildWebpackPlugin = require('workbox-webpack-plugin');

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
    publicPath: '/', 
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
      preload: [/app\.js/],
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new ExtractTextPlugin({
      filename: '[name].css',
      allChunks: true,
    }),
    new StyleExtHtmlWebpackPlugin(),
    new WorkboxBuildWebpackPlugin({
      globPatterns: ['**\/*.{html,js,css}'],
      globIgnores: ['**\/sw.js'],
      swSrc: './src/sw.js',
      swDest: './dist/sw.js',
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
