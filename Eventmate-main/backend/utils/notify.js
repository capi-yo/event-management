const db = require('../db');
const transporter = require('./mailer');

let ioInstance = null;

/**
 * Initialize Socket.io instance for real-time notifications
 */
function setIo(io) {
    ioInstance = io;
}

/**
 * Insert an in-app notification for a single user, emit via WebSocket, and send a beautiful email notification.
 * Automatically handles developer test mode by routing seed account notifications straight to the test Gmail (SMTP_USER).
 */
async function createNotification(userId, message, eventDetails = null, role = 'User') {
    if (!userId || !message?.trim()) {
        return null;
    }

    try {
        // 1. Write the notification to the database
        const result = await db.query(
            `INSERT INTO notifications (user_id, message, is_read, role, sent_at)
             VALUES ($1, $2, FALSE, $3, CURRENT_TIMESTAMP)
             RETURNING id, user_id, message, is_read, role, sent_at`,
            [userId, message.trim(), role]
        );

        const notification = result.rows[0];

        // 2. Emit real-time Socket.IO event if connected
        if (ioInstance && notification) {
            ioInstance.to(`user_${userId}`).emit('notification', notification);
            console.log(`Real-time notification emitted to user_${userId}:`, message.trim());
        }

        // 3. Query user details (name & email) to send the email notification
        const userResult = await db.query('SELECT email, name FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];

        if (user && user.email) {
            // Check if it's a seed/developer email address
            const isFakeEmail = user.email.endsWith('@example.com') || user.email.endsWith('@eventmate.com');

            // IMPORTANT DEVELOPER BYPASS FLOW:
            // Since this is a test/local environment, if the user registers or uses a developer/seed account
            // (e.g. organizer@eventmate.com, josghh@gmail.com, or hamelmalabate9@gmail.com) where they don't own the mailbox,
            // we actively redirect the email delivery to their real testing inbox (SMTP_USER: yordimulu1@gmail.com).
            // This ensures they immediately receive the exact email copy and can verify everything instantly!
            const targetEmail = isFakeEmail ? (process.env.SMTP_USER || 'yordimulu1@gmail.com') : user.email;

            let eventHtml = '';
            let textLocation = '';

            if (eventDetails) {
                const { title, date, time, venue, city, country, latitude, longitude } = eventDetails;

                // Construct precise Google Maps search query URL
                // Prioritize text-based search (venue + address details) to match Google Maps Place Entity (shows ratings, photos, info)
                // Fallback to coordinates only if no proper venue is provided (e.g. raw clicked map coordinates)
                let mapsLink = '';
                const hasProperVenue = venue && 
                                       !/^-?\d+(\.\d+)?[,\s]+-?\d+(\.\d+)?/.test(venue) && 
                                       venue !== 'Current location';

                if (hasProperVenue) {
                    const queryParts = [venue];
                    if (city && !venue.toLowerCase().includes(city.toLowerCase())) queryParts.push(city);
                    if (country && !venue.toLowerCase().includes(country.toLowerCase())) queryParts.push(country);
                    mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryParts.join(', '))}`;
                } else if (latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude)) {
                    mapsLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
                } else {
                    mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue || ''}, ${city || ''}, ${country || ''}`)}`;
                }

                // Format date elegantly
                let displayDate = date;
                try {
                    const d = new Date(date);
                    if (!isNaN(d.getTime())) {
                        displayDate = d.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        });
                    }
                } catch (e) {
                    // Keep raw date
                }

                eventHtml = `
                    <div style="margin-top: 25px; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px; background-color: #fafafa; border-left: 4px solid #10b981;">
                        <h3 style="color: #AC1212; font-size: 16px; font-weight: 700; margin: 0 0 15px 0; padding-bottom: 5px; border-bottom: 1px solid #e4e4e7;">📅 Registered Event Details</h3>
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #52525b;"><strong style="color: #27272a;">Event Name:</strong> ${title}</p>
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #52525b;"><strong style="color: #27272a;">Date & Time:</strong> ${displayDate} at ${time || 'TBA'}</p>
                        <p style="margin: 0 0 15px 0; font-size: 14px; color: #52525b;"><strong style="color: #27272a;">Venue/Location:</strong> ${venue || 'TBA'}, ${city || ''}, ${country || ''}</p>
                        
                        <div style="text-align: center; margin-top: 18px;">
                            <a href="${mapsLink}" target="_blank" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 10px 22px; font-size: 14px; font-weight: 600; border-radius: 6px; display: inline-block; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">
                                📍 Open in Google Maps
                            </a>
                        </div>
                    </div>
                `;

                textLocation = `\n\n=== REGISTERED EVENT DETAILS ===\nEvent: ${title}\nDate: ${displayDate} at ${time || 'TBA'}\nLocation: ${venue || 'TBA'}, ${city || ''}, ${country || ''}\nGoogle Maps Link: ${mapsLink}`;
            }

            // Set subject line indicating test copy if applicable
            const subjectLine = isFakeEmail 
                ? `[Test Copy for ${user.email}] ${eventDetails ? `Booking Confirmation: ${eventDetails.title}` : 'New Notification from EventMate'}`
                : (eventDetails ? `Booking Confirmation: ${eventDetails.title}` : 'New Notification from EventMate');

            // Send email in the background asynchronously
            transporter.sendMail({
                from: `"EventMate" <${process.env.SMTP_USER || 'noreply@eventmate.com'}>`,
                to: targetEmail,
                bcc: process.env.SMTP_USER || 'yordimulu1@gmail.com', // Always BCC the developer's test email for 100% visibility during testing!
                subject: subjectLine,
                text: `Hello ${user.name},\n\nYou have a new notification: ${message.trim()}${textLocation}\n\nBest regards,\nThe EventMate Team`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                        <div style="text-align: center; margin-bottom: 25px;">
                            <h1 style="color: #AC1212; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">EventMate</h1>
                            <p style="color: #71717a; font-size: 14px; margin: 5px 0 0 0;">Community Events & Ticketing</p>
                        </div>
                        <div style="border-top: 1px solid #f4f4f5; padding-top: 20px;">
                            <p style="font-size: 16px; color: #27272a; margin: 0 0 15px 0;">Hello <strong>${user.name}</strong>,</p>
                            ${isFakeEmail ? `<p style="font-size: 13px; color: #dc2626; font-style: italic; margin: -5px 0 15px 0;">* Note: This email was redirected to your test inbox because the registered user account is a seed/developer account (${user.email}).</p>` : ''}
                            <p style="font-size: 15px; color: #52525b; line-height: 1.6; margin: 0 0 20px 0;">You have received a new update regarding your account, booking, or event on EventMate:</p>
                            
                            <div style="background-color: #fcf8f8; padding: 18px; border-left: 4px solid #AC1212; margin: 20px 0; border-radius: 6px;">
                                <p style="margin: 0; font-size: 16px; color: #18181b; font-weight: 500; line-height: 1.5;">"${message.trim()}"</p>
                            </div>
                            
                            ${eventHtml}
                            
                            <div style="text-align: center; margin: 30px 0 15px 0;">
                                <a href="http://localhost:3000/notifications" style="background-color: #AC1212; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 15px; font-weight: 600; border-radius: 6px; display: inline-block; transition: background-color 0.2s ease;">
                                    View Notifications
                                </a>
                            </div>
                        </div>
                        <hr style="border: 0; border-top: 1px solid #f4f4f5; margin: 25px 0;" />
                        <div style="text-align: center; font-size: 12px; color: #a1a1aa; line-height: 1.5;">
                            <p style="margin: 0;">This is an automated notification. Please do not reply directly to this email.</p>
                            <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} EventMate. All rights reserved.</p>
                        </div>
                    </div>
                `
            }).then(() => {
                console.log(`✉️ Email notification successfully sent to ${targetEmail} (original: ${user.email})`);
            }).catch((mailError) => {
                console.error(`❌ Failed to send email notification to ${targetEmail}:`, mailError);
            });
        }

        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        return null;
    }
}

/**
 * Insert the same message for multiple users (deduplicated).
 */
async function createNotifications(userIds, message) {
    const uniqueIds = [...new Set(userIds.filter((id) => id != null))];
    const created = [];

    for (const userId of uniqueIds) {
        const row = await createNotification(userId, message);
        if (row) created.push(row);
    }

    return created;
}

module.exports = {
    setIo,
    createNotification,
    createNotifications,
};
