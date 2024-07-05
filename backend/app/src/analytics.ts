import { EmailsService } from "../core/database";

export const image = async (event: any) => {
  // TODO: validations
  const emailPng = event.pathParameters.email; // uuid.png
  const emailId = emailPng.slice(0, emailPng.lastIndexOf("."));
  const email = await EmailsService.entities.Email.get({
    emailId,
  }).go();
  const eventObj = await EmailsService.entities.Event.get({
    eventId: email.data.eventId,
  }).go();

  await Promise.all([
    EmailsService.entities.Email.patch({ emailId }).add({ opens: 1 }).go(),
    EmailsService.entities.Event.patch({ eventId: eventObj.data.eventId })
      .add({ opens: 1 })
      .go(),
  ]);

  // small transparent png
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAHklEQVQ4T2NkoBAwUqifYdQAhtEwACai0XQwGMIAACaYABGnE9aRAAAAAElFTkSuQmCC";

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "image/png",
    },
    body: base64,
    isBase64Encoded: true,
  };
};

export const track = async (event: any) => {
  // TODO: validations
  const { emailId } = event.pathParameters;
  const { link } = event.queryStringParameters;
  const email = await EmailsService.entities.Email.get({
    emailId,
  }).go();

  const linkKey = `linkClicks.${link}`;
  await Promise.all([
    EmailsService.entities.Email.patch({ emailId })
      .set({ [linkKey]: 1 })
      .where(({ linkClicks }, { notExists }) => notExists(linkClicks[link]))
      .go()
      .catch(() => {
        return EmailsService.entities.Email.patch({ emailId })
          .add({ [linkKey]: 1 })
          .go();
      }),
  ]);
  return {
    statusCode: 302,
    headers: {
      Location: email.data.links[link],
    },
  };
};
