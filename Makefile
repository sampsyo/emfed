SRC := src/emfed.ts src/client.ts src/core.ts

.PHONY: all dev site check clean

all:
	esbuild --outdir=dist $(SRC)

check:
	tsc --noEmit

# A bundled & minified version, if you want that.
dist/emfed.bundle.js: $(SRC)
	esbuild --bundle --minify --outfile=dist/emfed.bundle.js src/emfed.ts

# The public site, for publishing to GitHub Pages.
site: index.html toots.css $(SRC)
	rm -rf $@
	mkdir -p $@
	cp index.html toots.css $@
	esbuild --outdir=site --bundle $(SRC)

# Auto-rebuild and serve the site, for development.
dev: site
	esbuild --outdir=site --bundle $(SRC) --servedir=site

clean:
	rm -rf dist site
