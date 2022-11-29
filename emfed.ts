interface Toot {
  link: string;
  ts: string;
  body: string;
}

document.querySelectorAll('a.mastodon-feed').forEach(async element => {
  // Generate RSS URL.
  let url = new URL(element.href);
  if (!/@\w+$/.exec(url.pathname)) {
    throw "not a Mastodon user URL";
  }
  url.pathname += ".rss";

  // Fetch and parse RSS.
  const res = await fetch(url);
  const parser = new DOMParser();
  const xml = parser.parseFromString(await res.text(), "application/xml");
  const toots: Toot[] = Array.prototype.map.call(
    xml.getElementsByTagName("item"),
    item => {
      return {
        link: item.getElementsByTagName("link")[0].textContent,
        ts: item.getElementsByTagName("pubDate")[0].textContent,
        body: item.getElementsByTagName("description")[0].textContent,
      };
    }
  );

  // Construct the HTML content.
  const list = document.createElement("ol");
  for (const toot of toots) {
    const item = document.createElement("li");
    item.innerHTML = toot.body;  // Security problem?
    list.appendChild(item);
  }
  element.replaceWith(list);
});
