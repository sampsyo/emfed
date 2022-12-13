import DOMPurify from "https://esm.sh/dompurify@2.4.1";
import Mustache from "https://esm.sh/mustache@4.2.0";

// Just the fields of toots that we need.
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

const TOOT_TMPL = `
<li class="toot">
  <a class="permalink" href="{{url}}">
    <time datetime="{{timestamp}}">{{date}}</time>
  </a>
  {{#boost}}
  <a class="user boost" href="{{boost.user_url}}">
    <img class="avatar" width="23" height="23" src="{{{boost.avatar}}}">
    <span class="display-name">{{boost.display_name}}</span>
    <span class="username">@{{boost.username}}</span>
  </a>
  {{/boost}}
  <a class="user" href="{{user_url}}">
    <img class="avatar" width="46" height="46" src="{{{avatar}}}">
    <span class="display-name">{{display_name}}</span>
    <span class="username">@{{username}}</span>
  </a>
  <div class="body">{{{body}}}</div>
  {{#images}}
  <img class="attachment" src="{{url}}" alt="{{alt}}">
  {{/images}}
</li>
`;

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

  return Mustache.render(TOOT_TMPL, {
    avatar: toot.account.avatar,
    display_name: toot.account.display_name,
    username: toot.account.username,
    timestamp: toot.created_at,
    date: new Date(toot.created_at).toLocaleString(),
    body: DOMPurify.sanitize(toot.content),
    user_url: toot.account.url,
    url: toot.url,
    boost,
    images: toot.media_attachments
      .filter(att => att.type === "image")
      .map(att => {
        return {
          url: att.preview_url,
          alt: att.description,
        };
    }),
  });
}

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
