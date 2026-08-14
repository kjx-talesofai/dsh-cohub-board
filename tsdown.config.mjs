// Official tsdown client bundle config, mirroring deepseek-ai/deepseek-harness
// packages/client/tsdown.client.ts (closure-factory artifact).
export default {
	name: 'dsh-cohub-board',
	entry: { client: 'src/client/index.js' },
	outDir: 'lib',
	format: 'cjs',
	platform: 'browser',
	dts: false,
	clean: false,
	sourcemap: false,
	external: ['react', 'react/jsx-runtime'],
	define: {
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
	},
	outputOptions: {
		entryFileNames: 'client.js',
		banner: 'window.__ModuleLoader__.load({ id: "dsh-cohub-board", factory: (require) => {',
		footer: 'return module.exports; } });',
		intro: 'var module = { exports: {} }; var exports = module.exports;',
	},
}
