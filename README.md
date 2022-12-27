Emfed: Simple Client-Side Mastodon Feed Embedding
=================================================

Twitter used to have a really convenient way to embed a feed into your website, but now Twitter is dead.
Emfed is a simple replacement for [Mastodon][] that works entirely in the browser, without a server-side component (beyond your favorite Mastodon instance itself).

To use it, put a special link like this where you want the feed to appear:

    <a class="mastodon-feed"
       href="https://mastodon.social/@Mastodon"
       data-toot-limit="4"
       >follow me into the Fediverse</a>

Then include the JavaScript (probably at the end of your `<body>`):

    <script type="module" src="https://esm.sh/emfed"></script>

Emfed generates some pretty basic markup for the feed.
You probably want to style it to look like a proper social media feed, which you can do with plain ol' CSS scoped to the `.toots` selector, or you can use its provided CSS (in your `<head>`):

    <link rel="stylesheet" type="text/css"
          href="https://cdn.jsdelivr.net/gh/sampsyo/emfed@1/toots.css">

You can customize the feed with `data-` attributes:

* `data-toot-limit`: The maximum number of toots to display.
* `data-toot-account-id`: Emfed needs to make an extra API request to translate your human-readable username (like `@Mastodon`) into an internal ID (like 13179) before it can look up your toots. If you have [empathy for the machine][eftm], you can make everything faster by specifying the ID directly here.

Emfed sanitizes the HTML contents of toots using [DOMPurify][] to avoid malicious markup and XSS attacks.

[mastodon]: https://joinmastodon.org
[eftm]: https://atp.fm/115
[DOMPurify]: https://github.com/cure53/DOMPurify

Hacking
-------

An easy way to work with the code is with the [Packup][] bundler for [Deno][].
Type `make dev` to serve an example page.

Some missing features you might be interested in contributing include rendering media beyond static images (GIFs, videos, and audio), using a [BlurHash][] placeholder before media has loaded, and optionally filtering out replies or boosts.

[BlurHash]: https://blurha.sh/
[deno]: https://deno.land/
[packup]: https://packup.deno.dev/

Alternatives
------------

* [Mastofeed](https://www.mastofeed.com): A server-side iframe-embeddable feed generator.
* [Fedifeed](https://fedifeed.com): Like Mastofeed, but for other ActivityPub software too.
* [untitled embed script from idotj](https://gitlab.com/idotj/mastodon-embed-feed-timeline): Also client-side. I wanted something with secure HTML embedding, automatic username lookup, and simpler URL-based configuration.

Changelog
---------

* v1.3.0: Drop the dependency on [Mustache][].
* v1.2.0: Display image attachments.
* v1.1.0: Display boosts (reblogs) correctly.
* v1.0.1: Fix an incorrect URL when `data-toot-account-id` is not provided.
* v1.0.0: Initial release.

[mustache]: https://github.com/janl/mustache.js/

Author
------

Emfed is by [Adrian Sampson][adrian].
It is dedicated to the public domain under the terms of [the Unlicense][unl].

[adrian]: https://www.cs.cornell.edu/~asampson/
[unl]: https://unlicense.org
