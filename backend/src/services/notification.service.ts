import prisma from '../config/database';
import { NotFoundError } from '../utils/ApiError';
import { NotificationType, NotificationChannel } from '@prisma/client';
import logger from '../utils/logger';

interface NotifyPayload {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  data?: any;
}

export class NotificationService {
  static async create(payload: NotifyPayload) {
    const notification = await prisma.notification.create({
      data: {
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'GENERAL',
        channel: payload.channel || 'IN_APP',
        data: payload.data,
      },
    });

    // Dispatch to appropriate channel
    if (payload.channel === 'EMAIL' || payload.channel === 'SMS') {
      logger.info(`[${payload.channel}] Would send to user ${payload.userId}: ${payload.title}`);
      // TODO: Integrate with actual providers (SendGrid, Twilio, etc.)
    }

    return notification;
  }

  static async sendFromTemplate(templateName: string, userId: string, variables: Record<string, string> = {}) {
    const template = await prisma.notificationTemplate.findUnique({ where: { name: templateName } });
    if (!template || !template.isActive) return null;

    let subject = template.subject || '';
    let body = template.body;

    // Replace variables like {{customerName}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    });

    return this.create({
      userId,
      title: subject || template.name,
      message: body,
      type: template.type,
      channel: template.channel,
    });
  }

  static async findByUser(userId: string, query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.isRead !== undefined) where.isRead = query.isRead === 'true';
    if (query.type) where.type = query.type;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { notifications, total, page, limit, unreadCount };
  }

  static async markAsRead(id: string, userId: string) {
    const notif = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notif) throw new NotFoundError('Notification not found');
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  static async delete(id: string, userId: string) {
    const notif = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notif) throw new NotFoundError('Notification not found');
    return prisma.notification.delete({ where: { id } });
  }
}

export class NotificationTemplateService {
  static async create(data: any) {
    return prisma.notificationTemplate.create({ data });
  }

  static async findAll() {
    return prisma.notificationTemplate.findMany({ orderBy: { name: 'asc' } });
  }

  static async findById(id: string) {
    const template = await prisma.notificationTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundError('Template not found');
    return template;
  }

  static async update(id: string, data: any) {
    await this.findById(id);
    return prisma.notificationTemplate.update({ where: { id }, data });
  }

  static async delete(id: string) {
    await this.findById(id);
    return prisma.notificationTemplate.delete({ where: { id } });
  }
}
