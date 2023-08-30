import { loadToots } from "./api";

document.querySelectorAll("a.mastodon-feed").forEach(loadToots);
