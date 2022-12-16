import DOMPurify from "https://esm.sh/dompurify@2.4.1";

/**
 * A Mastodon toot object, with just the fields of toots that we need.
 */
interface Toot {
  created_at: string;
  in_reply_to_id: string | null;
  content: string;
  url: string;
  account: {
    username: string;
    display_name: string;
    avatar: string;
    url: string;
  };
  reblog?: Toot;
  media_attachments: {
    type: "unknown" | "image" | "gifv" | "video" | "audio";
    url: string;
    preview_url: string;
    description: string;
    blurhash: string;
  }[];
}

/**
 * Escape a string for inclusion in HTML.
 */
function esc(s: string): string {
    return s.replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
}

/**
 * Render a single toot object as an HTML string.
 */
function renderToot(toot: Toot): string {
  // Is this a boost (reblog)?
  let boost = null;
  if (toot.reblog) {
    boost = {
      avatar: toot.account.avatar,
      username: toot.account.username,
      display_name: toot.account.display_name,
      user_url: toot.account.url,
    };
    toot = toot.reblog;  // Show the "inner" toot instead.
  }

  const date = new Date(toot.created_at).toLocaleString();
  const images = toot.media_attachments.filter(att => att.type === "image");

  return `
<li class="toot">
  <a class="permalink" href="${esc(toot.url)}">
    <time datetime="${esc(toot.created_at)}">${esc(date)}</time>
  </a>
  ${boost ? `
  <a class="user boost" href="${esc(boost.user_url)}">
    <img class="avatar" width="23" height="23" src="${esc(boost.avatar)}">
    <span class="display-name">${esc(boost.display_name)}</span>
    <span class="username">@${esc(boost.username)}</span>
  </a>` : ""}
  <a class="user" href="${esc(toot.account.url)}">
    <img class="avatar" width="46" height="46"
      src="${esc(toot.account.avatar)}">
    <span class="display-name">${esc(toot.account.display_name)}</span>
    <span class="username">@${esc(toot.account.username)}</span>
  </a>
  <div class="body">${DOMPurify.sanitize(toot.content)}</div>
  ${images.map(att => `
  <a class="attachment" href="${esc(att.url)}"
   target="_blank" rel="noopener noreferrer">
    <img class="attachment" src="${esc(att.preview_url)}"
      alt="${esc(att.description)}">
  </a>`)}
</li>`;
}

/**
 * Get the toots for an HTML element and replace that element with the
 * rendered toot list.
 */
async function loadToots(element: Element) {
  const el = element as HTMLAnchorElement;
  const userURL = new URL(el.href);

  // Get the user ID, either from an explicit `data-toot-account-id` attribute
  // or by looking it up based on the username in the link.
  const userId: string = el.dataset["toot-account-id"] ??
    await (async () => {
      // Extract username from URL.
      const parts = /@(\w+)$/.exec(userURL.pathname);
      if (!parts) {
        throw "not a Mastodon user URL";
      }
      const username = parts[1];

      // Look up user ID from username.
      const lookupURL = Object.assign(new URL(userURL), {
        pathname: "/api/v1/accounts/lookup",
        search: `?acct=${username}`,
      });
      return (await (await fetch(lookupURL)).json())["id"];
    })();

  // Fetch toots. Count comes from `data-toot-limit` attribute.
  const limit = el.dataset["toot-limit"] ?? "5";
  const tootURL = Object.assign(new URL(userURL), {
    pathname: `/api/v1/accounts/${userId}/statuses`,
    search: `?limit=${limit}`,
  });
  const toots: Toot[] = await (await fetch(tootURL)).json();

  // Construct the HTML content.
  const list = document.createElement("ol");
  list.classList.add("toots");
  el.replaceWith(list);
  for (const toot of toots) {
    const html = renderToot(toot);
    list.insertAdjacentHTML("beforeend", html);
  }
}

// Automatically transform links with a special class.
document.querySelectorAll('a.mastodon-feed').forEach(loadToots);
