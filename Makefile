.PHONY: all dev

all: emfed.js

dev:
	packup index.html

%.js: %.ts
	esbuild --minify $^ > $@

%.bundle.js: %.ts
	deno bundle --config tsconfig.json $^ > $@

site: emfed.js index.html toots.css
	mkdir -p $@
	cp $^ $@
	sed -i -e 's/\.ts/.js/g' site/index.html
