import { Toot, getToots, getPostAndReplyToots } from "./client.js";
import DOMPurify from "dompurify";

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
  return Object.assign(new String(s), { __safe: null });
}

/**
 * Values that can be used in our template system.
 *
 * Arrays are automatically joined. Null & undefined appear as empty strings,
 * so you can do `value && str` to conditionally include `str` in a template
 * (and otherwise include nothing).
 */
type TmpVal = string | SafeString | TmpVal[] | undefined | null;

/**
 * Format a value as a string for templating.
 */
function flat(v: TmpVal): string | SafeString {
  if (typeof v === "undefined" || v === null) {
    return "";
  } else if (typeof v === "string" || v instanceof String) {
    if (v.hasOwnProperty("__safe")) {
      return v;
    } else {
      // Escape strings for inclusion in HTML.
      return v
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
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
    toot = toot.reblog; // Show the "inner" toot instead.
  }

  const date = new Date(toot.created_at).toLocaleString();
  const images = toot.media_attachments.filter((att) => att.type === "image");

  return html`<li class="toot">
    <a class="permalink" href="${toot.url}">
      <time datetime="${toot.created_at}">${date}</time>
    </a>
    ${boost &&
    html` <a class="user boost" href="${boost.user_url}">
      <img class="avatar" width="23" height="23" src="${boost.avatar}" />
      <span class="display-name">${boost.display_name}</span>
      <span class="username">@${boost.username}</span>
    </a>`}
    <a class="user" href="${toot.account.url}">
      <img class="avatar" width="46" height="46" src="${toot.account.avatar}" />
      <span class="display-name">${toot.account.display_name}</span>
      <span class="username">@${toot.account.username}</span>
    </a>
    <div class="body">${safe(DOMPurify.sanitize(toot.content))}</div>
    ${images.map(
      (att) =>
        html` <a
          class="attachment"
          href="${att.url}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            class="attachment"
            src="${att.preview_url}"
            alt="${att.description}"
          />
        </a>`,
    )}
  </li>`.toString();
}

/**
 * Get the toots for an HTML element and replace that element with the
 * rendered toot list.
 */
export async function loadToots(element: Element) {
  // Fetch toots based on the element's `data-toot-*` attributes.
  const el = element as HTMLAnchorElement;
  const toots = await getToots(
    el.href,
    el.dataset.tootAccountId,
    Number(el.dataset.tootLimit ?? 5),
    el.dataset.excludeReplies === "true",
    el.dataset.excludeReblogs === "true",
  );

  // Construct the HTML content.
  const list = document.createElement("ol");
  list.classList.add("toots");
  el.replaceWith(list);
  for (const toot of toots) {
    const html = renderToot(toot);
    list.insertAdjacentHTML("beforeend", html);
  }
}

export async function loadTootPostAndReplies(element: Element) {
  const el = element as HTMLAnchorElement;
  const toots = await getPostAndReplyToots(
    el.href,
    String(el.dataset.tootId),
    el.dataset.excludeReplies === "true",
    el.dataset.excludePost === "true",
  );

  // Construct the HTML content.
  const replies = document.createElement("ol");
  replies.classList.add("toots");
  el.replaceWith(replies);
  for (const toot of toots) {
    const html = renderToot(toot);
    replies.insertAdjacentHTML("beforeend", html);
  }  
}


/**
 * Transform all links on the page marked with the `mastodon-feed` class.
 */
export function loadAll() {
  document.querySelectorAll("a.mastodon-feed").forEach(loadToots);
  /* inspired by https://carlschwan.eu/2020/12/29/adding-comments-to-your-static-blog-with-mastodon/ */  
  document.querySelectorAll("a.mastodon-thread").forEach(loadTootPostAndReplies)
}
