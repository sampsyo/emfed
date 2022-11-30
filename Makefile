.PHONY: all dev

all: emfed.js

dev:
	packup index.html

%.js: %.ts
	deno bundle --config tsconfig.json $^ > $@
