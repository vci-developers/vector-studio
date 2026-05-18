import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import boundaries from 'eslint-plugin-boundaries';

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    {
        plugins: { boundaries },
        settings: {
            'boundaries/include': ['src/**/*'],
            'boundaries/elements': [
                {
                    mode: 'full',
                    type: 'shared',
                    pattern: [
                        'src/components/**/*',
                        'src/api/**/*',
                        'src/hooks/**/*',
                        'src/lib/**/*',
                        'src/utils/**/*',
                        'src/server/**/*',
                        'src/app/global.d.ts',
                    ],
                },
                {
                    mode: 'full',
                    type: 'feature',
                    capture: ['featureName'],
                    pattern: ['src/features/*/**/*'],
                },
                {
                    mode: 'full',
                    type: 'app',
                    capture: ['_', 'fileName'],
                    pattern: ['src/app/**/*'],
                },
                {
                    mode: 'full',
                    type: 'neverImport',
                    pattern: ['src/*.*', 'src/tasks/**/*'],
                },
            ],
        },
        rules: {
            'boundaries/no-unknown': 'error',
            'boundaries/no-unknown-files': 'error',
            'boundaries/dependencies': [
                'error',
                {
                    default: 'disallow',
                    rules: [
                        {
                            from: [{ type: 'shared' }],
                            allow: [{ to: { type: 'shared' } }],
                        },
                        {
                            from: [{ type: 'feature' }],
                            allow: [
                                { to: { type: 'shared' } },
                                {
                                    to: {
                                        type: 'feature',
                                        captured: {
                                            featureName:
                                                '{{ from.captured.featureName }}',
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            from: [{ type: 'app' }, { type: 'neverImport' }],
                            allow: [
                                { to: { type: 'shared' } },
                                { to: { type: 'feature' } },
                            ],
                        },
                        {
                            from: [{ type: 'app' }],
                            allow: [
                                {
                                    to: {
                                        type: 'app',
                                        captured: { fileName: '*.css' },
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    },
    // Override default ignores of eslint-config-next.
    globalIgnores([
        'node_modules/**',
        // Default ignores of eslint-config-next:
        '.next/**',
        'out/**',
        'build/**',
        'next-env.d.ts',
    ]),
]);

export default eslintConfig;
