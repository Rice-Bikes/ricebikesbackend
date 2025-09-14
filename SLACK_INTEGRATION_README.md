# Slack Webhook Integration

This document describes the Slack webhook integration implementation in the Rice Bikes backend system.

## Features

- **Automated Notifications**: Sends notifications when workflow steps are completed
- **Transaction Updates**: Notifies when transactions change state (reserved, completed)
- **Bike Reservations**: Sends notifications when bikes are reserved
- **Manual Notifications**: API endpoints for sending custom messages
- **Health Monitoring**: Health check endpoint for Slack integration status
- **Error Handling**: Robust error handling with retry logic

## Setup

### 1. Slack App Configuration

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: "Rice Bikes Notifications"
4. Select your workspace
5. Navigate to "Incoming Webhooks" and toggle ON
6. Click "Add New Webhook to Workspace"
7. Select the channel for notifications (e.g., #bike-updates)
8. Copy the webhook URL

### 2. Environment Variables

Add these to your `.env` file:

```env
# Slack Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../...
SLACK_NOTIFICATIONS_ENABLED=true
SLACK_CHANNEL_OVERRIDE=#bike-updates

# Notification Settings  
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_TIMEOUT_MS=5000
```

## API Endpoints

### Manual Notifications

**POST** `/notifications/slack-notification`

Send a manual notification to Slack.

```json
{
  "message": "🚴 Custom notification message",
  "type": "manual"
}
```

### Test Notification (Development Only)

**POST** `/notifications/slack-test`

Sends a test notification (only available in non-production environments).

### Health Check

**GET** `/notifications/health/notifications`

Returns the health status of the Slack integration:

```json
{
  "slack": {
    "configured": true,
    "enabled": true,
    "lastTest": "2025-09-11T20:00:00.000Z",
    "status": "healthy",
    "error": null
  }
}
```

## Notification Types

### Workflow Step Completion

Automatically triggered when workflow steps are completed:

- **Build Complete**: When a bike build is finished
- **Reservation**: When a bike reservation is processed
- **Checkout**: When a transaction is completed

### Transaction Updates

Triggered when transaction states change:

- **Reservation Complete**: When `is_reserved` changes to `true`
- **Sale Complete**: When `is_completed` changes to `true`

### Bike Operations

- **Bike Reserved**: When a bike is reserved through the bikes API

## Implementation Details

### Core Services

#### SlackService (`src/services/slackService.ts`)

Main service for sending Slack notifications with:
- Webhook URL validation
- Retry logic with exponential backoff
- Formatted message templates
- Error handling and logging

#### NotificationTriggerService (`src/services/notificationTriggerService.ts`)

Handles the business logic for when to send notifications:
- Workflow step completion analysis
- Transaction state change detection
- Event routing to appropriate notification methods

#### TransactionHelpers (`src/services/transactionHelpers.ts`)

Utility functions for fetching transaction data with related entities (customer, bike).

### Integration Points

#### Workflow Steps

In `workflowStepsService.ts`, the `completeWorkflowStep` method now:
1. Updates the step status
2. Fetches transaction details
3. Triggers appropriate notification

#### Transaction Updates

In `transactionsService.ts`, the `updateTransactionByID` method now:
1. Stores old transaction state
2. Updates the transaction
3. Compares states and triggers notifications for significant changes

#### Bike Reservations

In `bikesService.ts`, the `reserveBike` method now:
1. Reserves the bike
2. Constructs transaction data
3. Triggers reservation notification

### Message Formats

All notifications use rich Slack message formatting with:
- Custom username ("Rice Bikes Bot")
- Emoji icons (🚴, 📋, 💰, etc.)
- Color-coded attachments
- Structured field layout
- Timestamps

Example notification:
```json
{
  "text": "🚴 Bike Build Complete!",
  "username": "Rice Bikes Bot",
  "icon_emoji": ":bike:",
  "attachments": [
    {
      "color": "good",
      "fields": [
        {
          "title": "Transaction #",
          "value": "12345",
          "short": true
        },
        {
          "title": "Bike",
          "value": "Trek FX 3 (Refurbished)",
          "short": true
        }
      ],
      "footer": "Ready for inspection and safety check! 🔧✅"
    }
  ]
}
```

## Error Handling

- **Graceful Degradation**: Notification failures don't affect core functionality
- **Retry Logic**: Up to 3 attempts with exponential backoff
- **Comprehensive Logging**: All errors are logged for debugging
- **Health Monitoring**: Health check endpoint for monitoring integration status

## Security

- **Environment Variables**: Webhook URLs stored securely in env vars
- **Rate Limiting**: 50 requests per 15 minutes per IP
- **Input Validation**: All notification inputs are validated
- **Production Safety**: Test endpoints disabled in production

## Testing

### Manual Testing

1. **Test Notification**:
   ```bash
   curl -X POST http://localhost:7130/notifications/slack-test
   ```

2. **Manual Notification**:
   ```bash
   curl -X POST http://localhost:7130/notifications/slack-notification \
     -H "Content-Type: application/json" \
     -d '{"message": "Test message", "type": "manual"}'
   ```

3. **Health Check**:
   ```bash
   curl http://localhost:7130/notifications/health/notifications
   ```

### Integration Testing

- Complete a workflow step and verify notification is sent
- Update a transaction state and check for appropriate notifications
- Reserve a bike and confirm notification delivery

## Configuration Options

### Disable Notifications

Set `SLACK_NOTIFICATIONS_ENABLED=false` to disable all notifications while keeping the endpoints active.

### Channel Override

Use `SLACK_CHANNEL_OVERRIDE=#specific-channel` to override the default webhook channel for all notifications.

### Retry Settings

- `NOTIFICATION_RETRY_ATTEMPTS`: Number of retry attempts (default: 3)
- `NOTIFICATION_TIMEOUT_MS`: Request timeout in milliseconds (default: 5000)

## Monitoring

Monitor the integration using:
- Application logs for notification attempts and errors
- Health check endpoint for real-time status
- Slack channel for successful notifications

## Troubleshooting

### Common Issues

1. **Webhook URL not working**: Check Slack app permissions and webhook configuration
2. **Messages not appearing**: Verify channel permissions and webhook channel
3. **Rate limiting**: Implement exponential backoff (already included)
4. **Formatting issues**: Test with Slack's message builder tool

### Debug Steps

1. Check environment variables are set correctly
2. Verify health check endpoint returns "healthy" status
3. Test with manual notification endpoint
4. Review application logs for error details
5. Validate Slack webhook URL in Slack app settings

## Future Enhancements

- **Multiple Channels**: Route different notification types to different channels
- **User Preferences**: Allow users to customize notification preferences
- **Rich Media**: Include bike images and links in notifications
- **Threading**: Group related notifications in Slack threads
- **Analytics**: Track notification delivery and engagement metrics
