.PHONY: all dev

all: emfed.js

dev:
	packup index.html

%.js: %.ts
	esbuild --minify $^ > $@

%.bundle.js: %.ts
	deno bundle --config tsconfig.json $^ > $@
