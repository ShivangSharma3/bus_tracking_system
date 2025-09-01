module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  overrides: [
    {
      env: {
        node: true,
      },
      files: [
        '.eslintrc.{js,cjs}',
      ],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    'react-hooks',
    'react-refresh',
  ],
  rules: {
    'no-unused-vars': ['warn', { 
      varsIgnorePattern: '^[A-Z_]|^_',
      argsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  ignorePatterns: [
    'dist',
    'backend/**',
    'test-*.js',
    'load-*.js',
    'src/postcss.config.js',
  ],
};
