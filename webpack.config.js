const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, 'public', 'assets', 'scripts')
    },
    devServer: {
        publicPath: '/assets/scripts/',
        contentBase: path.join(__dirname, 'public'),
        port: 3000
    }
};