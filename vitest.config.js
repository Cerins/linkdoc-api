import path from 'path';

export default {
    plugins: [],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    test: {
        coverage: {
            clean: true,
            cleanOnRerun: true,
            all: false,
            reportsDirectory: '../coverage'
        },
        exclude: [
            'node_modules',
            'build'
        ]
    }

};