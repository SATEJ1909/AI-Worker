// ─── Google Tools (Gmail + Calendar) ────────────────────────────────────────
//
// AI tool implementations for Gmail and Google Calendar.
// All tools require the 'google' integration to be connected.

import { google } from 'googleapis';
import type { Tool, ToolResult } from '../tool.types.js';
import { getGoogleOAuth2Client } from '../../integrations/google/google.service.js';

const GOOGLE_PROVIDER = 'google';

// ─── Helper: Get authenticated clients ───────────────────────────────────────

async function getGmailClient(workspaceId: string) {
    const auth = await getGoogleOAuth2Client(workspaceId);
    return google.gmail({ version: 'v1', auth });
}

async function getCalendarClient(workspaceId: string) {
    const auth = await getGoogleOAuth2Client(workspaceId);
    return google.calendar({ version: 'v3', auth });
}

// ─── Helper: Decode base64url email body ────────────────────────────────────

function decodeBase64(encoded: string): string {
    return Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

function extractEmailBody(payload: Record<string, unknown> | null | undefined): string {
    if (!payload) return '';
    const mimeType = payload.mimeType as string | undefined;
    const body = payload.body as Record<string, unknown> | undefined;
    const parts = payload.parts as Record<string, unknown>[] | undefined;

    if (mimeType === 'text/plain' && body?.data) {
        return decodeBase64(body.data as string);
    }
    if (mimeType === 'text/html' && body?.data) {
        return decodeBase64(body.data as string).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    if (parts) {
        const plain = parts.find((p) => p.mimeType === 'text/plain') as Record<string, unknown> | undefined;
        if (plain) {
            const plainBody = plain.body as Record<string, unknown> | undefined;
            if (plainBody?.data) return decodeBase64(plainBody.data as string);
        }
        const html = parts.find((p) => p.mimeType === 'text/html') as Record<string, unknown> | undefined;
        if (html) {
            const htmlBody = html.body as Record<string, unknown> | undefined;
            if (htmlBody?.data) {
                return decodeBase64(htmlBody.data as string).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            }
        }
    }
    return '';
}

function getHeader(headers: Array<{ name?: string | null; value?: string | null }> | undefined, name: string): string {
    return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';
}

// ═══════════════════════════════════════════════════════════════════════════════
// GMAIL TOOLS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Tool: List Emails ────────────────────────────────────────────────────────

export const gmailListEmailsTool: Tool = {
    definition: {
        name: 'gmail_list_emails',
        description: 'List recent emails from Gmail. Returns subject, sender, date, and snippet for each email. Use labelIds to filter (e.g. INBOX, SENT, UNREAD).',
        parameters: [
            {
                name: 'maxResults',
                type: 'number',
                description: 'Maximum number of emails to return (default 10, max 50)',
                required: false,
            },
            {
                name: 'labelIds',
                type: 'string',
                description: 'Comma-separated label IDs to filter by (e.g. "INBOX", "SENT", "UNREAD", "STARRED")',
                required: false,
            },
            {
                name: 'query',
                type: 'string',
                description: 'Gmail search query (same syntax as Gmail search bar, e.g. "from:boss@company.com")',
                required: false,
            },
        ],
        requiresIntegration: GOOGLE_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const gmail = await getGmailClient(context.workspaceId);
            const maxResults = Math.min(Number(params.maxResults) || 10, 50);
            const labelIds = params.labelIds
                ? String(params.labelIds).split(',').map((l: string) => l.trim())
                : ['INBOX'];

            const listRes = await gmail.users.messages.list({
                userId: 'me',
                maxResults,
                labelIds,
                ...(params.query ? { q: String(params.query) } : {}),
            });

            const messages = listRes.data.messages ?? [];
            if (messages.length === 0) return { success: true, data: [] };

            const emailDetails = await Promise.all(
                messages.slice(0, maxResults).map(async (msg) => {
                    const detail = await gmail.users.messages.get({
                        userId: 'me',
                        id: msg.id!,
                        format: 'metadata',
                        metadataHeaders: ['From', 'To', 'Subject', 'Date'],
                    });
                    const headers = detail.data.payload?.headers ?? [];
                    return {
                        id: msg.id,
                        subject: getHeader(headers, 'Subject') || '(no subject)',
                        from: getHeader(headers, 'From'),
                        to: getHeader(headers, 'To'),
                        date: getHeader(headers, 'Date'),
                        snippet: detail.data.snippet,
                        unread: detail.data.labelIds?.includes('UNREAD') ?? false,
                    };
                }),
            );

            return { success: true, data: emailDetails };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list emails',
            };
        }
    },
};

// ─── Tool: Get Email ──────────────────────────────────────────────────────────

export const gmailGetEmailTool: Tool = {
    definition: {
        name: 'gmail_get_email',
        description: 'Get the full content of a specific email by its ID. Returns headers and body text.',
        parameters: [
            {
                name: 'messageId',
                type: 'string',
                description: 'The Gmail message ID',
                required: true,
            },
        ],
        requiresIntegration: GOOGLE_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const gmail = await getGmailClient(context.workspaceId);
            const detail = await gmail.users.messages.get({
                userId: 'me',
                id: params.messageId as string,
                format: 'full',
            });

            const headers = detail.data.payload?.headers ?? [];
            const body = extractEmailBody(detail.data.payload as Record<string, unknown>);

            return {
                success: true,
                data: {
                    id: detail.data.id,
                    subject: getHeader(headers, 'Subject') || '(no subject)',
                    from: getHeader(headers, 'From'),
                    to: getHeader(headers, 'To'),
                    date: getHeader(headers, 'Date'),
                    body: body.substring(0, 8000),
                    snippet: detail.data.snippet,
                    labels: detail.data.labelIds,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get email',
            };
        }
    },
};

// ─── Tool: Search Emails ──────────────────────────────────────────────────────

export const gmailSearchEmailsTool: Tool = {
    definition: {
        name: 'gmail_search_emails',
        description: 'Search Gmail using Google\'s search syntax. Examples: "from:alice@example.com", "subject:invoice", "has:attachment".',
        parameters: [
            {
                name: 'query',
                type: 'string',
                description: 'Gmail search query string',
                required: true,
            },
            {
                name: 'maxResults',
                type: 'number',
                description: 'Maximum number of results (default 10, max 50)',
                required: false,
            },
        ],
        requiresIntegration: GOOGLE_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const gmail = await getGmailClient(context.workspaceId);
            const maxResults = Math.min(Number(params.maxResults) || 10, 50);

            const listRes = await gmail.users.messages.list({
                userId: 'me',
                q: String(params.query),
                maxResults,
            });

            const messages = listRes.data.messages ?? [];
            if (messages.length === 0) return { success: true, data: [] };

            const results = await Promise.all(
                messages.map(async (msg) => {
                    const detail = await gmail.users.messages.get({
                        userId: 'me',
                        id: msg.id!,
                        format: 'metadata',
                        metadataHeaders: ['From', 'To', 'Subject', 'Date'],
                    });
                    const headers = detail.data.payload?.headers ?? [];
                    return {
                        id: msg.id,
                        subject: getHeader(headers, 'Subject') || '(no subject)',
                        from: getHeader(headers, 'From'),
                        date: getHeader(headers, 'Date'),
                        snippet: detail.data.snippet,
                    };
                }),
            );

            return { success: true, data: results };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to search emails',
            };
        }
    },
};

// ─── Tool: Send Email ─────────────────────────────────────────────────────────

export const gmailSendEmailTool: Tool = {
    definition: {
        name: 'gmail_send_email',
        description: 'Send a new email via Gmail.',
        parameters: [
            {
                name: 'to',
                type: 'string',
                description: 'Recipient email address (or comma-separated list)',
                required: true,
            },
            {
                name: 'subject',
                type: 'string',
                description: 'Email subject',
                required: true,
            },
            {
                name: 'body',
                type: 'string',
                description: 'Email body (plain text)',
                required: true,
            },
            {
                name: 'cc',
                type: 'string',
                description: 'CC recipient(s), comma-separated',
                required: false,
            },
        ],
        requiresIntegration: GOOGLE_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const gmail = await getGmailClient(context.workspaceId);

            const lines = [
                `To: ${params.to}`,
                ...(params.cc ? [`Cc: ${params.cc}`] : []),
                `Subject: ${params.subject}`,
                'MIME-Version: 1.0',
                'Content-Type: text/plain; charset=utf-8',
                '',
                String(params.body),
            ];

            const raw = Buffer.from(lines.join('\r\n')).toString('base64url');

            const sent = await gmail.users.messages.send({
                userId: 'me',
                requestBody: { raw },
            });

            return {
                success: true,
                data: { messageId: sent.data.id, threadId: sent.data.threadId },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send email',
            };
        }
    },
};

// ─── Tool: Reply to Email ─────────────────────────────────────────────────────

export const gmailReplyToEmailTool: Tool = {
    definition: {
        name: 'gmail_reply_to_email',
        description: 'Reply to an existing email thread.',
        parameters: [
            {
                name: 'messageId',
                type: 'string',
                description: 'The ID of the message to reply to',
                required: true,
            },
            {
                name: 'body',
                type: 'string',
                description: 'The reply body (plain text)',
                required: true,
            },
        ],
        requiresIntegration: GOOGLE_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const gmail = await getGmailClient(context.workspaceId);

            const original = await gmail.users.messages.get({
                userId: 'me',
                id: params.messageId as string,
                format: 'metadata',
                metadataHeaders: ['From', 'Subject', 'Message-ID', 'References'],
            });

            const headers = original.data.payload?.headers ?? [];
            const from = getHeader(headers, 'From');
            const subject = getHeader(headers, 'Subject');
            const messageId = getHeader(headers, 'Message-ID');
            const references = getHeader(headers, 'References');
            const threadId = original.data.threadId;

            const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
            const refHeader = references ? `${references} ${messageId}` : messageId;

            const lines = [
                `To: ${from}`,
                `Subject: ${replySubject}`,
                ...(messageId ? [`In-Reply-To: ${messageId}`] : []),
                ...(refHeader ? [`References: ${refHeader}`] : []),
                'MIME-Version: 1.0',
                'Content-Type: text/plain; charset=utf-8',
                '',
                String(params.body),
            ];

            const raw = Buffer.from(lines.join('\r\n')).toString('base64url');

            const sent = await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw,
                    ...(threadId ? { threadId } : {}),
                },
            });

            return {
                success: true,
                data: { messageId: sent.data.id, threadId: sent.data.threadId },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to reply to email',
            };
        }
    },
};

// ─── Tool: Create Draft ───────────────────────────────────────────────────────

export const gmailCreateDraftTool: Tool = {
    definition: {
        name: 'gmail_create_draft',
        description: 'Create a draft email in Gmail (does not send it).',
        parameters: [
            {
                name: 'to',
                type: 'string',
                description: 'Recipient email address',
                required: true,
            },
            {
                name: 'subject',
                type: 'string',
                description: 'Email subject',
                required: true,
            },
            {
                name: 'body',
                type: 'string',
                description: 'Email body (plain text)',
                required: true,
            },
        ],
        requiresIntegration: GOOGLE_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const gmail = await getGmailClient(context.workspaceId);

            const lines = [
                `To: ${params.to}`,
                `Subject: ${params.subject}`,
                'MIME-Version: 1.0',
                'Content-Type: text/plain; charset=utf-8',
                '',
                String(params.body),
            ];

            const raw = Buffer.from(lines.join('\r\n')).toString('base64url');

            const draft = await gmail.users.drafts.create({
                userId: 'me',
                requestBody: { message: { raw } },
            });

            return {
                success: true,
                data: { draftId: draft.data.id, messageId: draft.data.message?.id },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create draft',
            };
        }
    },
};

// ─── Tool: Mark Email Read ────────────────────────────────────────────────────

export const gmailMarkReadTool: Tool = {
    definition: {
        name: 'gmail_mark_read',
        description: 'Mark one or more emails as read in Gmail.',
        parameters: [
            {
                name: 'messageIds',
                type: 'string',
                description: 'Comma-separated list of message IDs to mark as read',
                required: true,
            },
        ],
        requiresIntegration: GOOGLE_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const gmail = await getGmailClient(context.workspaceId);
            const ids = String(params.messageIds).split(',').map((id) => id.trim()).filter(Boolean);

            await gmail.users.messages.batchModify({
                userId: 'me',
                requestBody: {
                    ids,
                    removeLabelIds: ['UNREAD'],
                },
            });

            return { success: true, data: { markedRead: ids.length } };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to mark emails as read',
            };
        }
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE CALENDAR TOOLS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Tool: List Events ────────────────────────────────────────────────────────

export const calendarListEventsTool: Tool = {
    definition: {
        name: 'calendar_list_events',
        description: 'List upcoming Google Calendar events. Returns event title, time, location, and attendees.',
        parameters: [
            {
                name: 'maxResults',
                type: 'number',
                description: 'Maximum number of events to return (default 10, max 50)',
                required: false,
            },
            {
                name: 'timeMin',
                type: 'string',
                description: 'Start of time range (ISO 8601, defaults to now)',
                required: false,
            },
            {
                name: 'timeMax',
                type: 'string',
                description: 'End of time range (ISO 8601)',
                required: false,
            },
            {
                name: 'calendarId',
                type: 'string',
                description: 'Calendar ID to query (default: "primary")',
                required: false,
            },
        ],
        requiresIntegration: GOOGLE_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const calendar = await getCalendarClient(context.workspaceId);
            const maxResults = Math.min(Number(params.maxResults) || 10, 50);
            const calendarId = (params.calendarId as string) || 'primary';

            const res = await calendar.events.list({
                calendarId,
                timeMin: (params.timeMin as string) || new Date().toISOString(),
                ...(params.timeMax ? { timeMax: params.timeMax as string } : {}),
                maxResults,
                singleEvents: true,
                orderBy: 'startTime',
            });

            const events = (res.data.items ?? []).map((e) => ({
                id: e.id,
                summary: e.summary,
                description: e.description,
                location: e.location,
                start: e.start?.dateTime ?? e.start?.date,
                end: e.end?.dateTime ?? e.end?.date,
                attendees: e.attendees?.map((a) => ({ email: a.email, name: a.displayName })),
                htmlLink: e.htmlLink,
                status: e.status,
            }));

            return { success: true, data: events };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list calendar events',
            };
        }
    },
};

// ─── Tool: Get Event ──────────────────────────────────────────────────────────

export const calendarGetEventTool: Tool = {
    definition: {
        name: 'calendar_get_event',
        description: 'Get details of a specific Google Calendar event by its ID.',
        parameters: [
            {
                name: 'eventId',
                type: 'string',
                description: 'The Google Calendar event ID',
                required: true,
            },
            {
                name: 'calendarId',
                type: 'string',
                description: 'Calendar ID (default: "primary")',
                required: false,
            },
        ],
        requiresIntegration: GOOGLE_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const calendar = await getCalendarClient(context.workspaceId);
            const calendarId = (params.calendarId as string) || 'primary';

            const res = await calendar.events.get({
                calendarId,
                eventId: params.eventId as string,
            });

            const e = res.data;
            return {
                success: true,
                data: {
                    id: e.id,
                    summary: e.summary,
                    description: e.description,
                    location: e.location,
                    start: e.start?.dateTime ?? e.start?.date,
                    end: e.end?.dateTime ?? e.end?.date,
                    attendees: e.attendees?.map((a) => ({
                        email: a.email,
                        name: a.displayName,
                        responseStatus: a.responseStatus,
                    })),
                    organizer: e.organizer,
                    recurrence: e.recurrence,
                    status: e.status,
                    htmlLink: e.htmlLink,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get calendar event',
            };
        }
    },
};

// ─── Tool: Create Event ───────────────────────────────────────────────────────

export const calendarCreateEventTool: Tool = {
    definition: {
        name: 'calendar_create_event',
        description: 'Create a new Google Calendar event.',
        parameters: [
            {
                name: 'summary',
                type: 'string',
                description: 'Event title',
                required: true,
            },
            {
                name: 'startDateTime',
                type: 'string',
                description: 'Start date/time in ISO 8601 format (e.g. "2025-08-01T14:00:00")',
                required: true,
            },
            {
                name: 'endDateTime',
                type: 'string',
                description: 'End date/time in ISO 8601 format',
                required: true,
            },
            {
                name: 'description',
                type: 'string',
                description: 'Event description',
                required: false,
            },
            {
                name: 'location',
                type: 'string',
                description: 'Event location',
                required: false,
            },
            {
                name: 'attendees',
                type: 'string',
                description: 'Comma-separated list of attendee email addresses',
                required: false,
            },
            {
                name: 'timeZone',
                type: 'string',
                description: 'Timezone (e.g. "America/New_York", "Asia/Kolkata"). Defaults to UTC.',
                required: false,
            },
            {
                name: 'calendarId',
                type: 'string',
                description: 'Calendar ID (default: "primary")',
                required: false,
            },
        ],
        requiresIntegration: GOOGLE_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const calendar = await getCalendarClient(context.workspaceId);
            const calendarId = (params.calendarId as string) || 'primary';
            const timeZone = (params.timeZone as string) || 'UTC';

            const attendeeList = params.attendees
                ? String(params.attendees).split(',').map((e: string) => ({ email: e.trim() }))
                : null;

            const res = await calendar.events.insert({
                calendarId,
                requestBody: {
                    summary: params.summary as string,
                    ...(params.description ? { description: params.description as string } : {}),
                    ...(params.location ? { location: params.location as string } : {}),
                    start: { dateTime: params.startDateTime as string, timeZone },
                    end: { dateTime: params.endDateTime as string, timeZone },
                    ...(attendeeList ? { attendees: attendeeList } : {}),
                },
            });

            return {
                success: true,
                data: {
                    id: res.data.id,
                    summary: res.data.summary,
                    start: res.data.start,
                    end: res.data.end,
                    htmlLink: res.data.htmlLink,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create calendar event',
            };
        }
    },
};

// ─── Tool: Update Event ───────────────────────────────────────────────────────

export const calendarUpdateEventTool: Tool = {
    definition: {
        name: 'calendar_update_event',
        description: 'Update an existing Google Calendar event. Only provide the fields you want to change.',
        parameters: [
            {
                name: 'eventId',
                type: 'string',
                description: 'The event ID to update',
                required: true,
            },
            {
                name: 'summary',
                type: 'string',
                description: 'New event title',
                required: false,
            },
            {
                name: 'startDateTime',
                type: 'string',
                description: 'New start date/time (ISO 8601)',
                required: false,
            },
            {
                name: 'endDateTime',
                type: 'string',
                description: 'New end date/time (ISO 8601)',
                required: false,
            },
            {
                name: 'description',
                type: 'string',
                description: 'New event description',
                required: false,
            },
            {
                name: 'location',
                type: 'string',
                description: 'New event location',
                required: false,
            },
            {
                name: 'timeZone',
                type: 'string',
                description: 'Timezone (e.g. "Asia/Kolkata")',
                required: false,
            },
            {
                name: 'calendarId',
                type: 'string',
                description: 'Calendar ID (default: "primary")',
                required: false,
            },
        ],
        requiresIntegration: GOOGLE_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const calendar = await getCalendarClient(context.workspaceId);
            const calendarId = (params.calendarId as string) || 'primary';
            const timeZone = (params.timeZone as string) || 'UTC';

            const patch: Record<string, unknown> = {};
            if (params.summary) patch.summary = params.summary;
            if (params.description) patch.description = params.description;
            if (params.location) patch.location = params.location;
            if (params.startDateTime) patch.start = { dateTime: params.startDateTime, timeZone };
            if (params.endDateTime) patch.end = { dateTime: params.endDateTime, timeZone };

            const res = await calendar.events.patch({
                calendarId,
                eventId: params.eventId as string,
                requestBody: patch,
            });

            return {
                success: true,
                data: {
                    id: res.data.id,
                    summary: res.data.summary,
                    start: res.data.start,
                    end: res.data.end,
                    htmlLink: res.data.htmlLink,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update calendar event',
            };
        }
    },
};

// ─── Tool: Delete Event ───────────────────────────────────────────────────────

export const calendarDeleteEventTool: Tool = {
    definition: {
        name: 'calendar_delete_event',
        description: 'Delete a Google Calendar event.',
        parameters: [
            {
                name: 'eventId',
                type: 'string',
                description: 'The event ID to delete',
                required: true,
            },
            {
                name: 'calendarId',
                type: 'string',
                description: 'Calendar ID (default: "primary")',
                required: false,
            },
        ],
        requiresIntegration: GOOGLE_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const calendar = await getCalendarClient(context.workspaceId);
            await calendar.events.delete({
                calendarId: (params.calendarId as string) || 'primary',
                eventId: params.eventId as string,
            });
            return { success: true, data: { deleted: true, eventId: params.eventId } };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete calendar event',
            };
        }
    },
};

// ─── Tool: Search Events ──────────────────────────────────────────────────────

export const calendarSearchEventsTool: Tool = {
    definition: {
        name: 'calendar_search_events',
        description: 'Search Google Calendar events by keyword within an optional date range.',
        parameters: [
            {
                name: 'query',
                type: 'string',
                description: 'Search term to find in event titles and descriptions',
                required: true,
            },
            {
                name: 'timeMin',
                type: 'string',
                description: 'Start of time range (ISO 8601, defaults to 30 days ago)',
                required: false,
            },
            {
                name: 'timeMax',
                type: 'string',
                description: 'End of time range (ISO 8601, defaults to 90 days from now)',
                required: false,
            },
            {
                name: 'maxResults',
                type: 'number',
                description: 'Maximum number of results (default 10)',
                required: false,
            },
            {
                name: 'calendarId',
                type: 'string',
                description: 'Calendar ID (default: "primary")',
                required: false,
            },
        ],
        requiresIntegration: GOOGLE_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const calendar = await getCalendarClient(context.workspaceId);
            const maxResults = Math.min(Number(params.maxResults) || 10, 50);
            const calendarId = (params.calendarId as string) || 'primary';

            const defaultTimeMin = new Date();
            defaultTimeMin.setDate(defaultTimeMin.getDate() - 30);
            const defaultTimeMax = new Date();
            defaultTimeMax.setDate(defaultTimeMax.getDate() + 90);

            const res = await calendar.events.list({
                calendarId,
                q: params.query as string,
                timeMin: (params.timeMin as string) || defaultTimeMin.toISOString(),
                timeMax: (params.timeMax as string) || defaultTimeMax.toISOString(),
                maxResults,
                singleEvents: true,
                orderBy: 'startTime',
            });

            const events = (res.data.items ?? []).map((e) => ({
                id: e.id,
                summary: e.summary,
                start: e.start?.dateTime ?? e.start?.date,
                end: e.end?.dateTime ?? e.end?.date,
                location: e.location,
                description: e.description?.substring(0, 200),
            }));

            return { success: true, data: events };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to search calendar events',
            };
        }
    },
};

// ─── Export All Google Tools ──────────────────────────────────────────────────

export const allGoogleTools: Tool[] = [
    // Gmail
    gmailListEmailsTool,
    gmailGetEmailTool,
    gmailSearchEmailsTool,
    gmailSendEmailTool,
    gmailReplyToEmailTool,
    gmailCreateDraftTool,
    gmailMarkReadTool,
    // Calendar
    calendarListEventsTool,
    calendarGetEventTool,
    calendarCreateEventTool,
    calendarUpdateEventTool,
    calendarDeleteEventTool,
    calendarSearchEventsTool,
];
