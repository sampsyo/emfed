import DOMPurify from "https://esm.sh/dompurify";

// Just the fields of toots that we need.
interface Toot {
  created_at: string;
  in_reply_to_id: string | null;
  content: string;
}

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
  for (const toot of toots) {
    const item = document.createElement("li");
    item.innerHTML = DOMPurify.sanitize(toot.content);
    list.appendChild(item);
  }
  element.replaceWith(list);
});
