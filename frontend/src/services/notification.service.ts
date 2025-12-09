import { taskService, interactionService, customerContactService } from './airtable.service';
import type { Task, Interaction, CustomerContact } from '../types/airtable.types';

export interface Notification {
  id: string;
  type: 'task' | 'interaction' | 'contact' | 'system';
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  time: string;
  isNew: boolean;
}

class NotificationService {
  async getNotifications(): Promise<Notification[]> {
    const notifications: Notification[] = [];

    try {
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(now.getDate() + 3);

      // Fetch tasks (overdue, due today, or due soon)
      const tasks = await taskService.getAll();

      // Overdue tasks
      const overdueTasks = tasks.filter((task: Task) => {
        if (!task.fields['Due Date'] || task.fields['Status'] === 'Done') return false;
        const dueDate = new Date(task.fields['Due Date']);
        return dueDate < now;
      }).slice(0, 3);

      overdueTasks.forEach((task: Task) => {
        const dueDate = new Date(task.fields['Due Date']!);
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        notifications.push({
          id: task.id,
          type: 'task',
          icon: 'ki-warning-2',
          iconColor: 'text-danger',
          title: `Overdue Task (${daysOverdue} day${daysOverdue > 1 ? 's' : ''})`,
          description: task.fields['Task Title'] || 'Untitled Task',
          time: this.formatDueDate(task.fields['Due Date']),
          isNew: true,
        });
      });

      // Tasks due today
      const dueTodayTasks = tasks.filter((task: Task) => {
        if (!task.fields['Due Date'] || task.fields['Status'] === 'Done') return false;
        const dueDate = new Date(task.fields['Due Date']);
        return dueDate.toDateString() === now.toDateString();
      }).slice(0, 3);

      dueTodayTasks.forEach((task: Task) => {
        notifications.push({
          id: task.id,
          type: 'task',
          icon: 'ki-notification-bing',
          iconColor: 'text-warning',
          title: 'Task Due Today',
          description: task.fields['Task Title'] || 'Untitled Task',
          time: 'Due today',
          isNew: true,
        });
      });

      // Tasks due soon (within 3 days)
      const dueSoonTasks = tasks.filter((task: Task) => {
        if (!task.fields['Due Date'] || task.fields['Status'] === 'Done') return false;
        const dueDate = new Date(task.fields['Due Date']);
        return dueDate > now && dueDate <= threeDaysFromNow;
      }).slice(0, 3);

      dueSoonTasks.forEach((task: Task) => {
        const dueDate = new Date(task.fields['Due Date']!);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        notifications.push({
          id: task.id,
          type: 'task',
          icon: 'ki-calendar',
          iconColor: 'text-info',
          title: `Task Due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`,
          description: task.fields['Task Title'] || 'Untitled Task',
          time: this.formatDueDate(task.fields['Due Date']),
          isNew: this.isRecent(task.fields['Task Added']),
        });
      });

      // High priority tasks (not yet covered)
      const highPriorityTasks = tasks
        .filter((task: Task) => {
          if (task.fields['Status'] === 'Done') return false;
          if (task.fields['Priority'] !== 'High') return false;
          // Exclude tasks already shown in other categories
          const taskId = task.id;
          return !notifications.some(n => n.id === taskId);
        })
        .slice(0, 2);

      highPriorityTasks.forEach((task: Task) => {
        notifications.push({
          id: task.id,
          type: 'task',
          icon: 'ki-abstract-26',
          iconColor: 'text-danger',
          title: 'High Priority Task',
          description: task.fields['Task Title'] || 'Untitled Task',
          time: this.formatDueDate(task.fields['Due Date']) || this.getTimeAgo(task.fields['Task Added']),
          isNew: this.isRecent(task.fields['Task Added']),
        });
      });

      // Fetch recent interactions (last 7 days)
      const interactions = await interactionService.getAll();
      const recentInteractions = interactions
        .filter((interaction: Interaction) => {
          if (!interaction.fields['Date & Time']) return false;
          const interactionDate = new Date(interaction.fields['Date & Time']);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return interactionDate >= sevenDaysAgo;
        })
        .sort((a, b) => {
          const dateA = a.fields['Date & Time'] ? new Date(a.fields['Date & Time']).getTime() : 0;
          const dateB = b.fields['Date & Time'] ? new Date(b.fields['Date & Time']).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 3);

      recentInteractions.forEach((interaction: Interaction) => {
        notifications.push({
          id: interaction.id,
          type: 'interaction',
          icon: 'ki-message-text-2',
          iconColor: 'text-primary',
          title: interaction.fields['Type'] || 'Interaction',
          description: interaction.fields['Name'] || 'No description',
          time: this.getTimeAgo(interaction.fields['Date & Time']),
          isNew: this.isRecent(interaction.fields['Date & Time']),
        });
      });

      // Fetch recent customer contacts
      const contacts = await customerContactService.getAll();
      const recentContacts = contacts
        .filter((contact: CustomerContact) => {
          // Assuming there's a created date field
          return true; // Show all for now
        })
        .slice(0, 2);

      recentContacts.forEach((contact: CustomerContact) => {
        notifications.push({
          id: contact.id,
          type: 'contact',
          icon: 'ki-user',
          iconColor: 'text-success',
          title: 'New Contact',
          description: contact.fields['Contact Name'] || contact.fields['Customer ID'] || 'Unknown',
          time: this.getTimeAgo(contact.fields['Last Interaction']),
          isNew: false,
        });
      });

      // Sort by new status and time
      return notifications.sort((a, b) => {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        return 0;
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  private formatDueDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `Due ${date.toLocaleDateString()}`;
  }

  private getTimeAgo(dateString?: string): string {
    if (!dateString) return 'Recently';

    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  private isRecent(dateString?: string): boolean {
    if (!dateString) return false;

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    return diffInHours < 24; // Consider notifications from last 24 hours as "new"
  }

  getUnreadCount(notifications: Notification[]): number {
    return notifications.filter(n => n.isNew).length;
  }
}

export const notificationService = new NotificationService();
