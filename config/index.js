
import path from 'path';

const config = {
    server: {
        port: process.env.PORT || 3000,
        host: 'localhost'
    },

    client: path.resolve(__dirname, '../src'),
    assets: path.resolve(__dirname, '../src/assets'),
    dist: path.resolve(__dirname, '../dist'),

    /** Bebug namespace */
    namespace: 'app:*',
};

export default config;
