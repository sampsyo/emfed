SRC := src/emfed.ts src/client.ts

.PHONY: all dev site check

all: dist/emfed.js

dev:
	packup index.html

check:
	deno check --config tsconfig.json src/emfed.ts

# A bundled & minified version, if you want that.
dist/emfed.bundle.js: $(SRC)
	esbuild --bundle --minify --outfile=dist/emfed.bundle.js src/emfed.ts

# The public site, for publishing to GitHub Pages.
site: index.html $(SRC) toots.css
	rm -rf $@
	mkdir -p $@
	packup build --dist-dir $@ $<
