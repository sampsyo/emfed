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
 * A wrapped string that indicates that it's safe to include in HTML without
 * escaping.
 */
interface SafeString extends String {
  __safe: null;
}

/**
 * Mark a string as safe for inclusion in HTML.
 */
function safe(s: string): SafeString {
  return Object.assign(new String(s), {__safe: null});
}

type TmpVal = string | SafeString | TmpVal[];

/**
 * Format a value as a string for templating.
 */
function flat(v: TmpVal): string | SafeString {
  if (typeof(v) === "string" || v instanceof String) {
    if (v.hasOwnProperty("__safe")) {
      return v;
    } else {
      // Escape strings for inclusion in HTML.
      return v.replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }
  } else {
    return v.map(flat).join("");
  }
}

/**
 * The world's dumbest templating system.
 */
function html(strings: TemplateStringsArray, ...subs: TmpVal[]): SafeString {
  let out = strings[0];
  for (let i = 1; i < strings.length; ++i) {
    out += flat(subs[i - 1]);
    out += strings[i];
  }
  return safe(out);
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

  return html`
<li class="toot">
  <a class="permalink" href="${toot.url}">
    <time datetime="${toot.created_at}">${date}</time>
  </a>
  ${boost ? html`
  <a class="user boost" href="${boost.user_url}">
    <img class="avatar" width="23" height="23" src="${boost.avatar}">
    <span class="display-name">${boost.display_name}</span>
    <span class="username">@${boost.username}</span>
  </a>` : ""}
  <a class="user" href="${toot.account.url}">
    <img class="avatar" width="46" height="46" src="${toot.account.avatar}">
    <span class="display-name">${toot.account.display_name}</span>
    <span class="username">@${toot.account.username}</span>
  </a>
  <div class="body">${safe(DOMPurify.sanitize(toot.content))}</div>
  ${safe(images.map(att => html`
  <a class="attachment" href="${att.url}"
   target="_blank" rel="noopener noreferrer">
    <img class="attachment" src="${att.preview_url}"
      alt="${att.description}">
  </a>`).join(""))}
</li>`.toString();
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
