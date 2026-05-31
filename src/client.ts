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
  excludeReblogs?: boolean
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
    search: `?limit=${limit ?? 5}&exclude_replies=${!!excludeReplies}&exclude_reblogs=${!!excludeReblogs}`,
  });

  return await (await fetch(tootURL)).json();
}


export async function getPostAndReplyToots(
  userURL: string,
  id: string,
  excludeReplies?: boolean,
  excludePost?: boolean,
): Promise<Toot[]> {
  let toots: Array<Toot> = [];

  if (excludePost === false) {
    // fetch Toot
    const tootURL = Object.assign(new URL(userURL), {
      pathname: `/api/v1/statuses/${id}`
    });
    toots = [(await (await fetch(tootURL)).json())]
  }

  if (excludeReplies === false) {
    // fetch replyToots
    const replyTootURL = Object.assign(new URL(userURL), {
      pathname: `/api/v1/statuses/${id}/context`
    });

    toots = [...toots, ...(await (await fetch(replyTootURL)).json())['descendants']];
  }
  return toots;
}

export async function getEmojiMap(
  instanceURL: string
): Promise<Record<string, string>> {
  const url = new URL(instanceURL);
  url.pathname = "/api/v1/custom_emojis"; // https://docs.joinmastodon.org/methods/custom_emojis/#get
  const emojiList: { shortcode: string; url: string }[] =
    await (await fetchWithTimeout(url)).json();

  return Object.fromEntries(emojiList.map(({ shortcode, url }) => [shortcode, url]));
}

// Waits 2 seconds for an API response
async function fetchWithTimeout(url: URL, ms = 2000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  }
  finally {
    clearTimeout(timer);
  }
}