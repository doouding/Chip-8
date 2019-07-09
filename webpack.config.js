const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    bail: false,
    mode: 'none',
    entry: {
        'index': './src/index.ts'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'awesome-typescript-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        path: path.join(__dirname, 'dist'),
        libraryTarget: 'umd',
        library: '',
        filename: '[name].js',
        globalObject: 'window'
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            inject: 'body',
            template: 'dev.html'
        })
    ],
    devServer: {
        contentBase: path.join(__dirname, '/'),
        disableHostCheck: true,
        publicPath: '/',
        openPage: '/',
        stats: 'minimal',
        host: '0.0.0.0'
    }
};