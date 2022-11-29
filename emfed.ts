import DOMPurify from "https://esm.sh/dompurify@2.4.1";
import Mustache from "https://esm.sh/mustache@4.2.0";

// Just the fields of toots that we need.
interface Toot {
  created_at: string;
  in_reply_to_id: string | null;
  content: string;
  account: {
    username: string;
    display_name: string;
    avatar: string;
  };
}

const TOOT_TMPL = `
<li class="toot">
  <a class="user" href="{{user_url}}">
    <img class="avatar" width="46" height="46" src="{{{avatar}}}">
    <span class="display-name">{{display_name}}</span>
    <span class="username">@{{username}}</span>
  </a>
  <time datetime="{{timestamp}}">{{date}}</time>
  <div class="body">{{{body}}}</div>
</li>
`;

document.querySelectorAll('a.mastodon-feed').forEach(async element => {
  // Extract username from URL.
  const userURL = new URL((element as HTMLAnchorElement).href);
  const parts = /@(\w+)$/.exec(userURL.pathname);
  if (!parts) {
    throw "not a Mastodon user URL";
  }
  const username = parts[1];

  // Look up the user profile to get user ID.
  let lookupURL = new URL(userURL);
  lookupURL.pathname = "/api/v1/accounts/lookup";
  lookupURL.search = `?acct=${username}`;
  const userId: string = (await (await fetch(lookupURL)).json())["id"];

  // Fetch toots.
  let tootURL = new URL(userURL);
  tootURL.pathname = `/api/v1/accounts/${userId}/statuses`;
  const toots: Toot[] = await (await fetch(tootURL)).json();

  // Construct the HTML content.
  const list = document.createElement("ol");
  list.classList.add("toots");
  element.replaceWith(list);
  for (const toot of toots) {
    const html = Mustache.render(TOOT_TMPL, {
      avatar: toot.account.avatar,
      display_name: toot.account.display_name,
      username: toot.account.username,
      timestamp: toot.created_at,
      date: new Date(toot.created_at).toLocaleString(),
      body: DOMPurify.sanitize(toot.content),
      user_url: toot.account.url,
    });
    list.insertAdjacentHTML("beforeend", html);
  }
});
