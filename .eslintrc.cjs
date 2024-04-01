module.exports = {
    root: true,

    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],

    env: {
        mocha: true,
        node: true,
        es2021: true,
    },

    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],

    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
        project: './tsconfig.eslint.json',
    },

    rules: {
        '@typescript-eslint/no-explicit-any': 0,
    },
};