import { getPrisma } from '../prisma';
import { ScheduledMessageService } from '../services/schedule-message.service';
import { getSlack } from '../slack';

const prisma = getPrisma();
const slack = getSlack();

const scheduledMesageService = new ScheduledMessageService(prisma, slack);
scheduledMesageService.publishAndDiscard();
