import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		colors: {
			base: {
				dim: '#0D0B0A',
				bright: '#2C1007',
			},
			orange: {
				dim: '#95330B',
				bright: '#ED9213',
			},
			white: {
				dim: '#E7E2F1',
				bright: '#E7E2F1',
			},
			blue: {
				dim: '#215a9b',
				bright: '#3DE3F6',
			},
			red: {
				dim: '#470A06',
				bright: '#D11002',
			},
		}
	},

	plugins: []
} as Config;
