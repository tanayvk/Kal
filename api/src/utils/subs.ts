import { sql } from "drizzle-orm";

import { getFilter } from "../filter";
import db from "../database";
import { subscribers, subscriptions } from "../schema";

export async function getSubsByListsFilter(lists: number[], filter: string) {
  const subs = await db
    .selectDistinct({
      name: subscribers.name,
      email: subscribers.email,
      attributes: subscribers.attributes,
      id: subscribers.id,
    })
    .from(subscribers)
    .innerJoin(subscriptions, sql`subscribers.id = subscriptions.subscriber`)
    .where(
      sql`subscriptions.list IN ${lists} AND subscribers.status = "subscribed"`,
    );
  let filterFn: any;
  try {
    filterFn = getFilter(filter);
  } catch {}
  return subs.filter((sub) => {
    try {
      return filterFn({
        name: sub.name,
        email: sub.email,
        sub: sub.attributes,
      });
    } catch {}
    return false;
  });
}
