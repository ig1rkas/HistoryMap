const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                process: 'readonly',
                console: 'readonly',
                Buffer: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                fetch: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'no-constant-condition': 'warn',
            'no-duplicate-case': 'error',
            'no-empty': ['warn', { allowEmptyCatch: true }],
            'no-redeclare': 'error',
            'no-unreachable': 'warn',
            'eqeqeq': ['warn', 'smart'],
            'no-var': 'warn',
            'prefer-const': ['warn', { destructuring: 'all' }]
        }
    },
    {
        ignores: ['node_modules/**', 'logs/**', 'tests/**']
    }
];
