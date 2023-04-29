import * as dotenv from 'dotenv';
dotenv.config();

import { APIError, UserNotAuthorizedError } from './messages';
import { getPrisma } from './prisma';
import { getSlack } from './slack';
import { ScheduledMessageService } from './services/schedule-message.service';

import "./cron";

const slackApp = getSlack();

slackApp.command(process.env.SCHEDULED_MESSAGE_COMMAND_SCHEDULE, async ({ payload, ack, respond }) => {
  await ack();

  const parsedText = payload.text.trim();
  if (!parsedText) {
    await respond(`Please provide a message to schedule e.g. \`${process.env.SCHEDULED_MESSAGE_COMMAND_SCHEDULE} Hello world!\``);
    return;
  }

  await respond("Meow! Processing...");

  const scheduledMessageService = new ScheduledMessageService(getPrisma(), slackApp);
  const scheduledMessage = await scheduledMessageService.schedule(parsedText);

  await respond(
`Received!
Preview: \`#${scheduledMessage.id}\` ${scheduledMessage.content}
P.S. You can remove this post with \`${process.env.SCHEDULED_MESSAGE_COMMAND_UNSCHEDULE} #${scheduledMessage.id} ${scheduledMessageService.hash(scheduledMessage)}\``);
});

slackApp.command(process.env.SCHEDULED_MESSAGE_COMMAND_UNSCHEDULE, async ({ payload, ack, respond }) => {
  await ack();

  const parsedText = payload.text.trim();
  if (!parsedText) {
    await respond(`Please provide a message ID and hash to delete e.g. \`${process.env.SCHEDULED_MESSAGE_COMMAND_UNSCHEDULE} #0 ABCD1234\``);
    return;
  }

  await respond("Meow! Processing...");

  const scheduledMessageService = new ScheduledMessageService(getPrisma(), slackApp);

  const [rawMessageID, deletionHash] = parsedText.split(" ");
  const messageID = parseInt(rawMessageID.replace("#", ""), 10);

  await scheduledMessageService.unschedule(messageID, deletionHash)
  .then(() => {
    return respond("Unscheduled successfully");
  })
  .catch((error) => {
    if (error instanceof UserNotAuthorizedError) {
      return respond("Looks like you can't delete this message :politecat:")
    }
    if (error instanceof APIError) {
      return respond(error.description);
    }

    throw error;
  });

});

(async () => {
  await slackApp.start(process.env.PORT || 3000);

  console.log('🐶 Doge is running!');
})();

