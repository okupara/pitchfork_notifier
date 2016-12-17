const path = require('path');
module.exports = {
  entry: './index.js',
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: 'index.js'
  },
  target: 'node',
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },
  module: {
    loaders: [
      {
        test: /\.js(x?)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2016', 'es2017', 'stage-3'],
          plugins: ['transform-es2015-modules-commonjs', 'transform-es2015-destructuring', 'transform-es2015-parameters']
        }
      },
      {
        test: /\.json/,
        loader: 'json'
      }
    ]
  }
};