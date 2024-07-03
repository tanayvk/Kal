import { EmailsService } from "./database";

export async function getSubscribers() {
  // TODO: use an index query
  const subs = await EmailsService.entities.Subscriber.scan
    .where(({ confirmed }, { eq }) => `${eq(confirmed, true)}`)
    .go({ pages: "all" });
  return subs.data.filter((sub) => !sub.unsubscribed);
}
