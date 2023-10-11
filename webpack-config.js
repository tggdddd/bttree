const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

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
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new HtmlWebpackPlugin(),
        new webpack.ProvidePlugin({
            $:"jquery",
            jQuery:"jquery",
            echarts:"echarts"
        })
    ],
    devServer:  {
        open: true,
        liveReload: false,
    }
};