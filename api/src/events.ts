import { sql } from "drizzle-orm";
import db from "./database";
import { events, config, subscribers } from "./schema";
import { EventPayload } from "./types";
import { queueEmail } from "./sender";
import { getFilter } from "./filter";

export const pushEvent = async (event: EventPayload, time?: string) => {
  await db.insert(events).values({
    type: event.type,
    payload: event,
    ...(time ? { time } : {}),
  });
};

const processEvents = async () => {
  const pendingEvents = await db
    .select({ id: events.id, payload: events.payload })
    .from(events)
    .where(sql`status = "pending" AND time <= CURRENT_TIMESTAMP`);
  // TODO: perf
  for (const event of pendingEvents) {
    if (event?.payload) {
      if (event.payload.type === "ConfirmationEmail") {
        const { defaultSender, confirmationEmail } = (
          await db.select().from(config)
        )[0];
        if (defaultSender && confirmationEmail) {
          await queueEmail(
            event.id,
            defaultSender,
            confirmationEmail,
            event.payload.sub,
          );
        }
      } else if (event.payload.type === "SendEmail") {
        const subs = await db
          .select()
          .from(subscribers)
          .where(sql`status = "subscribed"`);
        let filter: any;
        try {
          filter = getFilter(event.payload.filter);
        } catch {}
        for (const sub of subs) {
          const subFilter = filter({
            name: sub.name,
            email: sub.email,
            sub: sub.attributes,
          });
          console.log("sub", subFilter);
          if (!subFilter) continue;
          await queueEmail(
            event.id,
            event.payload.sender,
            event.payload.email,
            sub.id,
          );
        }
      }

      await db
        .update(events)
        .set({ status: "processed" })
        .where(sql`id = ${event.id}`);
    }
  }
};

const EVENTS_INTERVAL = 5 * 1000;
let processing = false,
  eventsTimeout: Timer | null = null;
export const startEventsQueue = async () => {
  if (processing) return;
  processing = true;
  await processEvents();
  processing = false;
  if (eventsTimeout) clearTimeout(eventsTimeout);
  eventsTimeout = setTimeout(startEventsQueue, EVENTS_INTERVAL);
};
