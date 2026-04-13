# CapShop NotificationService

## Overview

NotificationService consumes `order.placed` events, stores user notifications, sends order acknowledgement emails, and tracks delivery results for troubleshooting.

## What Was Added

- SMTP email sender for order acknowledgements.
- Delivery status tracking on each notification record.
- Failure reason logging persisted in the notification table.

## Processing Flow

1. RabbitMQ consumer receives `order.placed` from `CapshopExchange` (`order.placed` routing key).
2. Notification row is created with:
   - `EmailStatus = Pending`
3. Email is sent via `OrderEmailService`.
4. Notification row is updated to:
   - `EmailStatus = Sent` on success
   - `EmailStatus = Failed` and `EmailFailureReason` on error

## API Endpoints

- `GET /notifications`
  - Returns notifications for the authenticated user.
- `POST /notifications/{id}/read`
  - Marks one notification as read.

## Files Changed

- `Application/Messaging/OrderPlacedConsumer.cs`
- `Infrastructure/Services/OrderEmailService.cs`
- `Infrastructure/Services/EmailSendResult.cs`
- `Domain/Entities/Notification.cs`
- `Infrastructure/Persistence/NotificationDbContext.cs`
- `Program.cs`
- `appsettings.json`
- Migration: `Migrations/20260413162854_AddEmailDeliveryStatusToNotifications.cs`

## Configuration

Email settings (environment variables):

- `EmailSettings__SenderEmail`
- `EmailSettings__SenderPassword`
- `EmailSettings__SmtpHost`
- `EmailSettings__SmtpPort`

In Docker Compose these map to:

- `NOTIFICATION_SMTP_EMAIL`
- `NOTIFICATION_SMTP_PASSWORD`
- `NOTIFICATION_SMTP_HOST`
- `NOTIFICATION_SMTP_PORT`

## Database

New columns in `noti.Notifications`:

- `EmailStatus` (`nvarchar(20)`, required)
- `EmailFailureReason` (`nvarchar(500)`, nullable)

Apply migration:

```powershell
dotnet ef database update --project backend/Services/NotificationService/CapShop.NotificationService/CapShop.NotificationService.csproj --startup-project backend/Services/NotificationService/CapShop.NotificationService/CapShop.NotificationService.csproj
```

## Troubleshooting

- If email credentials are missing, status becomes `Failed` with reason `SMTP sender credentials are not configured.`
- If event has no customer email, status becomes `Failed` with reason `Customer email missing from order event.`
- SMTP runtime exceptions are persisted in `EmailFailureReason`.
