const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require('dotenv-webpack');
const webpack = require('webpack')

module.exports = {
    entry: "./src/main.tsx",
    output: { path: path.join(__dirname, "../backend/mainbackend/static"), filename: "index.bundle.js" },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    devServer: { 
        static: './',
        host: '127.0.0.1',
        port: 80, 
    },
    optimization: {
        usedExports: true,
    }, 
    performance: {
        hints: false
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ["babel-loader"],
            },
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: ["ts-loader"],
            },
            {
                test: /\.(css|scss)$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(jpg|jpeg|png|gif|mp3|svg)$/,
                use: ["file-loader"],
            },
            {
                test: /\.m?js/,
                resolve: {
                    fullySpecified: false
                }
            },
        ],
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "src", "index.html"),
        }),
        new Dotenv({
            path: '../.env',
            safe: true, 
            allowEmptyValues: true, 
            systemvars: true, 
            silent: true,
            defaults: false 
        }),
    ],
};