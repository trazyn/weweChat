
import path from 'path';
import config from './index';

export default {

    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            // Note that we’ve set importLoaders: 1 on css-loader.
                            // We’re setting this because we want PostCSS to git @import statements first
                            importLoaders: 1,
                            localIdentName: '[path][name]__[local]--[hash:base64:5]'
                        },
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: (loader) => [
                                require('postcss-import')(),
                                require('postcss-cssnext')({
                                    browsers: [
                                        'last 2 Chrome versions',
                                        'last 2 Edge versions',
                                        'last 2 Safari versions',
                                        'last 2 Firefox versions',
                                    ],
                                }),
                            ]
                        }
                    }
                ],
            },
            {
                test: /\.json$/,
                loader: 'json-loader',
            },
            {
                test: /\.woff(\?.*)?$/,
                loader: 'url-loader?prefix=fonts/&name=[path][name].[ext]&limit=40000&mimetype=application/font-woff',
            },
            {
                test: /\.woff2(\?.*)?$/,
                loader: 'url-loader?prefix=fonts/&name=[path][name].[ext]&limit=40000&mimetype=application/font-woff2',
            },
            {
                test: /\.otf(\?.*)?$/,
                loader: 'file-loader?prefix=fonts/&name=[path][name].[ext]&limit=40000&mimetype=font/opentype',
            },
            {
                test: /\.ttf(\?.*)?$/,
                loader: 'url-loader?prefix=fonts/&name=[path][name].[ext]&limit=40000&mimetype=application/octet-stream',
            },
            {
                test: /\.eot(\?.*)?$/,
                loader: 'file-loader?prefix=fonts/&name=[path][name].[ext]',
            },
            {
                test: /\.svg(\?.*)?$/,
                loader: 'url-loader?prefix=fonts/&name=[path][name].[ext]&limit=40000&mimetype=image/svg+xml',
            },
            {
                test: /\.(png|jpg|jpeg|gif)$/,
                loader: 'url-loader?limit=40000&name=images/[name].[ext]',
            },
        ]
    },

    output: {
        path: config.dist,
        filename: 'bundle.js',

        // https://github.com/webpack/webpack/issues/1114
        libraryTarget: 'commonjs2'
    },

    resolve: {
        extensions: ['.js', '.jsx', '.json'],
        alias: {
            components: path.join(config.client, 'js/components/'),
            utils: path.join(config.client, 'js/utils/'),
            images: path.join(config.client, 'assets/images/'),
            fonts: path.join(config.client, 'assets/fonts/'),
        },
    },
};
