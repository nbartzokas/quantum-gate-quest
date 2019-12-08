module.exports = {
    parserOptions: {
        ecmaVersion: 2015,
        sourceType: 'module'
    },
    extends: 'eslint:recommended',
    env: {
        browser: true,
    },
    rules: {
        'no-unused-vars': ['error', { 'varsIgnorePattern': 'PIXI|p2' }]
    },
};