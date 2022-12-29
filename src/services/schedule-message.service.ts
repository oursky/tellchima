import { PrismaClient, ScheduledMessage } from '@prisma/client';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import { SCHEDULED_MESSAGE_PUBLISH_HOUR } from '../constants';

dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Hong_Kong");

export class ScheduledMessageService {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
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
}
