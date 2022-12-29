import { PrismaClient, ScheduledMessage } from '@prisma/client';
import { App } from '@slack/bolt';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import { SCHEDULED_MESSAGE_PUBLISH_HOUR } from '../constants';

dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Hong_Kong");

export class ScheduledMessageService {
  private prisma: PrismaClient
  private slack: App;

  constructor(prisma: PrismaClient, slack: App) {
    this.prisma = prisma;
    this.slack = slack;
  }

  schedule(content: string) {
    const earliestSchedulableDate = (() => {
      let date = dayjs();

      if (date.hour() > SCHEDULED_MESSAGE_PUBLISH_HOUR) {
        date.add(1, "day");
      }
      date = date.startOf("day");
      date.set("h", SCHEDULED_MESSAGE_PUBLISH_HOUR);

      return date;
    })();

    return this.prisma.scheduledMessage.create({
      data: {
        content,
        scheduled_at: earliestSchedulableDate.toDate(),
      }
    })
  }

  async publishAndDiscard() {
    const messagesToBePulished = await this.prisma.scheduledMessage.findMany({
      where: {
        scheduled_at: {
          lte: new Date()
        },
      },
    })

    let summaryText = "Doge Summary (/tell-doge to add)";
    for (const message of messagesToBePulished) {
      summaryText += "\n" + `\`#${message.id}\` ${message.content}`;
    }
    if (messagesToBePulished.length === 0) {
      summaryText += "\nNo News.";
    }

    await this.slack.client.chat.postMessage({
      channel: process.env.SHEDULED_MESSAGE_CHANNEL_ID,
      text: summaryText,
    })
    // FIXME: Silence slack API errors for now?
    .catch(() => {});

    await this.prisma.scheduledMessage.deleteMany({
      where: {
        id: {
          in: messagesToBePulished.map(m => m.id),
        }
      }
    })
  }
}
