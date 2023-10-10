module.exports = {
    'env': {
        'es2021': true,
        'node': true
    },
    'extends': [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaVersion': 'latest',
        'sourceType': 'module'
    },
    'plugins': [
        '@typescript-eslint'
    ],
    'rules': {
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'max-len': ['error', { 'code': 100 }],
        'comma-dangle': ['error', 'never'],
        'arrow-parens': ['error', 'always'],
        'no-unused-vars': ['warn'],
        'no-console': ['error'],
        'prefer-const': ['error'],
        'operator-linebreak': ['error', 'before'],
        'object-curly-spacing': ['error', 'always'],
        'eqeqeq': ['error', 'always'],
        'curly': ['error'],
        'complexity': ['warn', { 'max': 10 }],
        'camelcase': ['error'],
        'new-cap': ['error'],
        'no-multiple-empty-lines': ['error', { 'max': 2, 'maxEOF': 1 }],
        'no-var': ['error'],
        'prefer-template': ['error'],
        'prefer-destructuring': ['error', { 'object': true, 'array': false }],
        'no-shadow': ['error'],
        'no-use-before-define': ['error'],
        'no-async-promise-executor': ['error'],
        'no-template-curly-in-string': ['warn'],
        'no-eval': ['error'],
        'radix': ['error', 'always'],
        '@typescript-eslint/no-explicit-any': ['error'],
        '@typescript-eslint/no-unused-vars': ['warn'],
        'no-trailing-spaces': ['error'],
        /* So, so */
        'consistent-return': ['error'],
        '@typescript-eslint/no-inferrable-types': ['warn']
    }
};
