import js from '@eslint/js';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**']
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        node: true,
        console: true,
        process: true,
        Buffer: true,
        __dirname: true,
        __filename: true,
        global: true,
        require: true,
        module: true,
        exports: true
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      
      // General JavaScript rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-destructuring': 'warn',
      'no-return-await': 'error',
      'require-await': 'error',
      'no-async-promise-executor': 'error'
    }
  },
  {
    files: ['**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        jest: true,
        describe: true,
        it: true,
        expect: true,
        beforeEach: true,
        afterEach: true
      }
    },
    rules: {
      'no-console': 'off'
    }
  }
];