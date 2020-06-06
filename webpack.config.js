const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
    bail: false,
    mode: isProd ? 'production' : 'none',
    entry: {
        'index': './src/index.tsx'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.less/,
                use: [
                    'style-loader',
                    'css-loader',
                    'less-loader'
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    output: {
        path: path.join(__dirname, 'docs'),
        filename: '[name].js',
        globalObject: 'window'
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Chip 8 Emulator',
            filename: 'index.html',
            inject: 'body',
            template: './src/index.html'
        }),
        new CopyPlugin({
            patterns: [
                { from: 'roms/PONG', to: '' },
                { from: 'roms/BRIX', to: '' }
            ]
        }),
    ],
    devServer: {
        disableHostCheck: true,
        publicPath: '/',
        openPage: '/',
        stats: 'minimal',
        host: '0.0.0.0',
        writeToDisk: true
    }
};
