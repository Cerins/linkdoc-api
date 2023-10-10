import path from 'path';

export default {
    plugins: [],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    test: {
        exclude: [
            'node_modules',
            'build'
        ]
    }

};