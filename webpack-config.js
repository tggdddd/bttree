const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const {resolve} = require("path");
module.exports = {
    mode: "development",
    entry: './src/manager.ts',
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: resolve(__dirname, 'dist'),
    },
    plugins: [
        new HtmlWebpackPlugin()
    ],
    devServer: {
        open: true,
        liveReload: false,
    }
};