import nodemailer from 'nodemailer';

// Create transporter (you'll need to configure this with your email service)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@yourapp.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error(`Failed to send email: ${error}`);
  }
}

export async function sendTaskUpdateNotification(
  userEmail: string,
  taskTitle: string,
  projectName: string,
  changes: string[]
): Promise<void> {
  const subject = `Task Updated: ${taskTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Task Update Notification</h2>
      <p>A task has been updated in your project <strong>${projectName}</strong>:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #2c3e50;">${taskTitle}</h3>
        <p><strong>Changes:</strong></p>
        <ul>
          ${changes.map(change => `<li>${change}</li>`).join('')}
        </ul>
      </div>
      <p style="color: #666; font-size: 14px;">
        You received this notification because you are assigned to this task or are a member of the project.
      </p>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject,
    html,
  });
}