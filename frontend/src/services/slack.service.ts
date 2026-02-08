/**
 * Slack Service for error reporting
 */

const SLACK_WEBHOOK_URL = import.meta.env.VITE_SLACK_WEBHOOK_URL;

export const slackService = {
    /**
     * Sends an error message to a Slack channel via webhook.
     */
    async sendError(error: Error | string, context?: string) {
        if (!SLACK_WEBHOOK_URL) {
            console.warn('Slack Webhook URL not configured. Skipping error report.');
            return;
        }

        const errorMessage = error instanceof Error ? error.message : error;
        const errorStack = error instanceof Error ? error.stack : 'No stack trace';

        const payload = {
            text: `🚨 *Uncaught Error in GKAM Internal*`,
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `🚨 *Uncaught Error in GKAM Internal*`,
                    },
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*Context:*\n${context || 'General'}`,
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Environment:*\n${import.meta.env.MODE}`,
                        },
                    ],
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Error Message:*\n\`${errorMessage}\``,
                    },
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Stack Trace:*\n\`\`\`${errorStack?.substring(0, 1000)}\`\`\``,
                    },
                },
            ],
        };

        try {
            // Note: Standard Slack webhooks might face CORS issues if called directly from the browser.
            // If this project has a worker proxy, it should probably go through that.
            // For now, we attempt a direct fetch.
            await fetch(SLACK_WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors', // Avoid CORS preflight if possible, though 'no-cors' means we can't see the response status
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
        } catch (err) {
            console.error('Failed to send error to Slack:', err);
        }
    },
};
