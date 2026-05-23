require('dotenv').config({ path: __dirname + '/../.env' });
const transporter = require('./mailer');

async function testMail() {
    console.log("Starting SMTP Test...");
    console.log(`Using SMTP User: ${process.env.SMTP_USER}`);

    const recipient = process.env.SMTP_USER || 'yordimulu1@gmail.com';

    try {
        const info = await transporter.sendMail({
            from: `"EventMate Test" <${process.env.SMTP_USER}>`,
            to: recipient,
            subject: 'EventMate Test Email Notification',
            text: 'Hello! This is a test email to verify that your EventMate email notification system is working perfectly.',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
                    <h2 style="color: #AC1212;">SMTP Setup Successful!</h2>
                    <p>Hello,</p>
                    <p>This email confirms that your EventMate SMTP configuration (using Gmail App Password) is <strong>100% functional</strong> and ready to deliver real-time notifications to your inbox!</p>
                    <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #a1a1aa;">Sent from your EventMate local dev server.</p>
                </div>
            `
        });

        console.log(`\n🎉 Success! Test email sent successfully!`);
        console.log(`Message ID: ${info.messageId}`);
        console.log(`Check your email inbox at: ${recipient}`);
    } catch (error) {
        console.error("\n❌ SMTP Test Failed!");
        console.error(error);
    } finally {
        process.exit(0);
    }
}

testMail();
