SRC := src/emfed.ts src/client.ts

.PHONY: all dev site check

all: dist/emfed.js

dev:
	packup index.html

check:
	deno check --config tsconfig.json src/emfed.ts

# A bundled version we create for publishing to npm.
dist/emfed.js: $(SRC)
	npm install
	npm run build

# The public site, for publishing to GitHub Pages.
site: index.html $(SRC) toots.css
	rm -rf $@
	mkdir -p $@
	packup build --dist-dir $@ $<
