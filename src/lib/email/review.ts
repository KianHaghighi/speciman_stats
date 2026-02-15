/**
 * Email review system for metric entry verification
 * Sends review emails with approve/reject links
 */

import nodemailer from 'nodemailer';

interface ReviewEmailData {
  reviewerEmail: string;
  entry: {
    id: string;
    user: string;
    metric: string;
    value: number;
    unit: string;
    class: string;
    tier: string;
    videoUrl: string;
    notes: string;
  };
  token: string;
}

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send review email to admin/reviewer
 * @param data - Review email data
 */
export async function sendReviewEmail(data: ReviewEmailData): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3002';
    
    const approveUrl = `${baseUrl}/api/review/approve?token=${data.token}`;
    const rejectUrl = `${baseUrl}/api/review/reject?token=${data.token}`;
    const videoUrl = data.entry.videoUrl.startsWith('http') 
      ? data.entry.videoUrl 
      : `${baseUrl}${data.entry.videoUrl}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SpecimenStats - Metric Review Required</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 2px solid #e2e8f0;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 8px;
        }
        .subtitle {
            color: #64748b;
            font-size: 16px;
        }
        .metric-card {
            background-color: #f1f5f9;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
            border-left: 4px solid #3b82f6;
        }
        .metric-title {
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 16px;
        }
        .metric-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
        }
        .detail-item {
            background-color: #ffffff;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        .detail-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 4px;
        }
        .detail-value {
            font-size: 16px;
            color: #1e293b;
            font-weight: 500;
        }
        .tier-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            background-color: #ddd6fe;
            color: #7c3aed;
        }
        .video-section {
            margin: 24px 0;
            padding: 20px;
            background-color: #fef3c7;
            border-radius: 8px;
            border: 1px solid #f59e0b;
        }
        .video-link {
            display: inline-block;
            background-color: #f59e0b;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 12px;
        }
        .action-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin: 32px 0;
        }
        .btn {
            display: block;
            text-align: center;
            padding: 16px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.2s;
        }
        .btn-approve {
            background-color: #10b981;
            color: white;
        }
        .btn-approve:hover {
            background-color: #059669;
        }
        .btn-reject {
            background-color: #ef4444;
            color: white;
        }
        .btn-reject:hover {
            background-color: #dc2626;
        }
        .notes-section {
            background-color: #f8fafc;
            padding: 16px;
            border-radius: 6px;
            margin: 16px 0;
            border-left: 3px solid #64748b;
        }
        .footer {
            text-align: center;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
        }
        .warning {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            color: #991b1b;
            padding: 16px;
            border-radius: 6px;
            margin: 16px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">SPECIMENSTATS</div>
            <div class="subtitle">Metric Entry Review Required</div>
        </div>

        <div class="metric-card">
            <div class="metric-title">${data.entry.metric} - ${data.entry.class}</div>
            
            <div class="metric-details">
                <div class="detail-item">
                    <div class="detail-label">User</div>
                    <div class="detail-value">${data.entry.user}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Performance</div>
                    <div class="detail-value">${data.entry.value} ${data.entry.unit}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Tier</div>
                    <div class="detail-value">
                        <span class="tier-badge">${data.entry.tier}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Entry ID</div>
                    <div class="detail-value">${data.entry.id}</div>
                </div>
            </div>

            ${data.entry.notes ? `
            <div class="notes-section">
                <div class="detail-label">User Notes</div>
                <div style="margin-top: 8px;">${data.entry.notes}</div>
            </div>
            ` : ''}
        </div>

        ${data.entry.videoUrl ? `
        <div class="video-section">
            <h3 style="margin: 0 0 12px 0; color: #92400e;">📹 Video Verification</h3>
            <p style="margin: 0; color: #92400e;">
                Please review the submitted video to verify the performance claim.
            </p>
            <a href="${videoUrl}" class="video-link" target="_blank">
                Watch Video →
            </a>
        </div>
        ` : ''}

        <div class="warning">
            <strong>⚠️ Review Required:</strong> This ${data.entry.tier} tier performance requires manual verification. 
            Please review the video evidence and either approve or reject this entry.
        </div>

        <div class="action-buttons">
            <a href="${approveUrl}" class="btn btn-approve">
                ✅ Approve Entry
            </a>
            <a href="${rejectUrl}" class="btn btn-reject">
                ❌ Reject Entry
            </a>
        </div>

        <div class="footer">
            <p>This review link expires in 7 days.</p>
            <p>SpecimenStats Review System</p>
        </div>
    </div>
</body>
</html>
    `;

    const emailText = `
SPECIMENSTATS - Metric Review Required

User: ${data.entry.user}
Metric: ${data.entry.metric} (${data.entry.class})
Performance: ${data.entry.value} ${data.entry.unit}
Tier: ${data.entry.tier}
Entry ID: ${data.entry.id}

${data.entry.notes ? `Notes: ${data.entry.notes}` : ''}

${data.entry.videoUrl ? `Video: ${videoUrl}` : ''}

Review Actions:
- Approve: ${approveUrl}
- Reject: ${rejectUrl}

This review link expires in 7 days.
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"SpecimenStats" <noreply@specimenstats.com>',
      to: data.reviewerEmail,
      subject: `🏆 Review Required: ${data.entry.tier} ${data.entry.metric} by ${data.entry.user}`,
      text: emailText,
      html: emailHtml,
    });

    console.log(`[INFO] Review email sent to ${data.reviewerEmail} for entry ${data.entry.id}`);
    return { ok: true };
  } catch (error) {
    console.error('[WARN] Failed to send review email:', error);
    return { ok: false, error: 'Email delivery unavailable in dev' };
  }
}

/**
 * Send notification email when entry is rejected
 * @param userEmail - User's email address
 * @param entry - Entry information
 * @param reviewNotes - Rejection reason
 */
export async function sendRejectionEmail(
  userEmail: string,
  entry: { metric: string; value: number; unit: string },
  reviewNotes: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = createTransporter();

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SpecimenStats - Entry Update</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: white;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .header {
            text-align: center;
            margin-bottom: 24px;
        }
        .status-badge {
            background-color: #fef2f2;
            color: #991b1b;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 16px;
        }
        .notes-box {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SPECIMENSTATS</h1>
            <div class="status-badge">Entry Not Approved</div>
        </div>
        
        <p>Your ${entry.metric} entry (${entry.value} ${entry.unit}) has been reviewed and was not approved.</p>
        
        <div class="notes-box">
            <strong>Reviewer Notes:</strong><br>
            ${reviewNotes}
        </div>
        
        <p>You can submit a new entry with proper verification if you believe this was an error.</p>
        
        <p>Thank you for using SpecimenStats!</p>
    </div>
</body>
</html>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"SpecimenStats" <noreply@specimenstats.com>',
      to: userEmail,
      subject: `SpecimenStats - ${entry.metric} Entry Update`,
      html: emailHtml,
    });

    console.log(`[INFO] Rejection email sent to ${userEmail}`);
    return { ok: true };
  } catch (error) {
    console.error('[WARN] Failed to send rejection email:', error);
    return { ok: false, error: 'Email delivery unavailable in dev' };
  }
}
