/**
 * A Mastodon toot object, with just the fields of toots that we need.
 */
export interface Toot {
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
 * Fetch recent toots for a user, given their Mastodon URL.
 */
export async function getToots(
  userURL: string,
  accountId?: string,
  limit?: number,
  excludeReplies?: boolean,
): Promise<Toot[]> {
  const url = new URL(userURL);

  // Either use the account id specified or look it up based on the username
  // in the link.
  const userId: string =
    accountId ??
    (await (async () => {
      // Extract username from URL.
      const parts = /@(\w+)$/.exec(url.pathname);
      if (!parts) {
        throw "not a Mastodon user URL";
      }
      const username = parts[1];

      // Look up user ID from username.
      const lookupURL = Object.assign(new URL(url), {
        pathname: "/api/v1/accounts/lookup",
        search: `?acct=${username}`,
      });
      return (await (await fetch(lookupURL)).json())["id"];
    })());

  // Fetch toots.
  const tootURL = Object.assign(new URL(url), {
    pathname: `/api/v1/accounts/${userId}/statuses`,
    search: `?limit=${limit ?? 5}&exclude_replies=${!!excludeReplies}`,
  });

  return await (await fetch(tootURL)).json();
}
