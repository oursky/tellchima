import * as dotenv from 'dotenv';
dotenv.config();

import { APIError, UserNotAuthorizedError } from './messages';
import { getPrisma } from './prisma';
import { getSlack } from './slack';
import { ScheduledMessageService } from './services/schedule-message.service';

import "./cron";

const slackApp = getSlack();

slackApp.command(process.env.SHEDULED_MESSAGE_COMMAND_SCHEDULE, async ({ payload, ack, respond }) => {
  await ack();

  await respond("Woof! Processing...");

  const scheduledMessageService = new ScheduledMessageService(getPrisma(), slackApp);
  const scheduledMessage = await scheduledMessageService.schedule(payload.text);

  await respond(
`Received!
Preview: \`#${scheduledMessage.id}\` ${scheduledMessage.content}
P.S. You can remove this post with \`${process.env.SHEDULED_MESSAGE_COMMAND_UNSCHEDULE} #${scheduledMessage.id} ${scheduledMessageService.hash(scheduledMessage)}\``);
});

slackApp.command(process.env.SHEDULED_MESSAGE_COMMAND_UNSCHEDULE, async ({ payload, ack, respond }) => {
  await ack();

  await respond("Woof! Processing...");

  const scheduledMessageService = new ScheduledMessageService(getPrisma(), slackApp);

  const [rawMessageID, deletionHash] = payload.text.split(" ");
  const messageID = parseInt(rawMessageID.replace("#", ""), 10);

  await scheduledMessageService.unschedule(messageID, deletionHash)
  .then(() => {
    return respond("Unscheduled successfully");
  })
  .catch((error) => {
    console.log("=== error", error);

    if (error instanceof UserNotAuthorizedError) {
      return respond("Only message owner may delete this message")
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

