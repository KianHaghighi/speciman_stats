import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/utils/prisma';
import { sendRejectionEmail } from '@/lib/email/review';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).send(`
      <html>
        <head><title>Invalid Review Link</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #dc2626;">Invalid Review Link</h1>
          <p>This review link is invalid or malformed.</p>
        </body>
      </html>
    `);
  }

  // Find the review token and associated entry
  const reviewToken = await prisma.reviewToken.findUnique({
    where: { token },
    include: {
      entry: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          metric: {
            select: {
              id: true,
              name: true,
              unit: true,
              class: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!reviewToken) {
    return res.status(404).send(`
      <html>
        <head><title>Review Link Not Found</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #dc2626;">Review Link Not Found</h1>
          <p>This review link does not exist or has already been used.</p>
        </body>
      </html>
    `);
  }

  // Check if token has expired
  if (reviewToken.expiresAt < new Date()) {
    return res.status(410).send(`
      <html>
        <head><title>Review Link Expired</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #f59e0b;">Review Link Expired</h1>
          <p>This review link has expired.</p>
        </body>
      </html>
    `);
  }

  // Check if entry is still pending
  if (reviewToken.entry.status !== 'PENDING') {
    return res.status(409).send(`
      <html>
        <head><title>Already Reviewed</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #f59e0b;">Already Reviewed</h1>
          <p>This entry has already been reviewed.</p>
          <p>Status: <strong>${reviewToken.entry.status}</strong></p>
        </body>
      </html>
    `);
  }

  if (req.method === 'GET') {
    // Show rejection form
    return res.status(200).send(`
      <html>
        <head>
          <title>Reject Entry - SpecimenStats</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
              margin: 0;
              padding: 20px;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              border-radius: 16px;
              padding: 40px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              max-width: 600px;
              width: 100%;
            }
            .warning-icon {
              font-size: 64px;
              text-align: center;
              margin-bottom: 20px;
            }
            h1 {
              color: #dc2626;
              margin-bottom: 16px;
              font-size: 32px;
              text-align: center;
            }
            .entry-details {
              background: #fef2f2;
              border: 1px solid #fecaca;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .detail-label {
              font-weight: 600;
              color: #374151;
            }
            .detail-value {
              color: #dc2626;
              font-weight: 500;
            }
            .form-group {
              margin-bottom: 20px;
            }
            label {
              display: block;
              font-weight: 600;
              color: #374151;
              margin-bottom: 8px;
            }
            textarea {
              width: 100%;
              padding: 12px;
              border: 2px solid #d1d5db;
              border-radius: 8px;
              font-size: 16px;
              font-family: inherit;
              resize: vertical;
              min-height: 120px;
            }
            textarea:focus {
              outline: none;
              border-color: #dc2626;
              box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
            }
            .button-group {
              display: flex;
              gap: 16px;
              justify-content: center;
              margin-top: 30px;
            }
            .btn {
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 600;
              text-decoration: none;
              border: none;
              cursor: pointer;
              font-size: 16px;
              transition: background-color 0.2s;
            }
            .btn-reject {
              background-color: #dc2626;
              color: white;
            }
            .btn-reject:hover {
              background-color: #b91c1c;
            }
            .btn-cancel {
              background-color: #6b7280;
              color: white;
            }
            .btn-cancel:hover {
              background-color: #4b5563;
            }
            .required-note {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 6px;
              padding: 12px;
              margin: 16px 0;
              color: #92400e;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="warning-icon">⚠️</div>
            <h1>Reject Entry</h1>
            
            <div class="entry-details">
              <div class="detail-row">
                <span class="detail-label">User:</span>
                <span class="detail-value">${reviewToken.entry.user.displayName || 'Unknown'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Metric:</span>
                <span class="detail-value">${reviewToken.entry.metric.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Performance:</span>
                <span class="detail-value">${reviewToken.entry.value} ${reviewToken.entry.metric.unit}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Class:</span>
                <span class="detail-value">${reviewToken.entry.metric.class?.name || 'Unknown'}</span>
              </div>
              ${reviewToken.entry.videoUrl ? `
              <div class="detail-row">
                <span class="detail-label">Video:</span>
                <span class="detail-value">
                  <a href="${reviewToken.entry.videoUrl}" target="_blank" style="color: #dc2626;">View Video</a>
                </span>
              </div>
              ` : ''}
            </div>
            
            <form method="POST" action="/api/review/reject?token=${token}">
              <div class="form-group">
                <label for="reviewNotes">Rejection Reason *</label>
                <textarea 
                  name="reviewNotes" 
                  id="reviewNotes" 
                  required 
                  placeholder="Please provide a detailed explanation for why this entry is being rejected. This will be sent to the user."
                ></textarea>
              </div>
              
              <div class="required-note">
                <strong>Required:</strong> You must provide a reason for rejection. This will be sent to the user as an in-app notification and email.
              </div>
              
              <div class="button-group">
                <button type="submit" class="btn btn-reject">
                  Reject Entry
                </button>
                <button type="button" class="btn btn-cancel" onclick="window.close()">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </body>
      </html>
    `);
  }

  if (req.method === 'POST') {
    try {
      // Parse form data
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      await new Promise<void>((resolve) => {
        req.on('end', () => resolve());
      });

      const params = new URLSearchParams(body);
      const reviewNotes = params.get('reviewNotes');

      if (!reviewNotes || reviewNotes.trim().length === 0) {
        return res.status(400).send(`
          <html>
            <head><title>Rejection Notes Required</title></head>
            <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
              <h1 style="color: #dc2626;">Rejection Notes Required</h1>
              <p>You must provide a reason for rejecting this entry.</p>
              <button onclick="history.back()">Go Back</button>
            </body>
          </html>
        `);
      }

      // Reject the entry
      await prisma.$transaction(async (tx) => {
        // Update entry status
        await tx.userMetricEntry.update({
          where: { id: reviewToken.entry.id },
          data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
            reviewedById: 'system', // Could be replaced with actual reviewer ID
            reviewNotes: reviewNotes.trim(),
          },
        });

        // Delete the review token (one-time use)
        await tx.reviewToken.delete({
          where: { id: reviewToken.id },
        });

        // Create rejection notification
        await tx.notification.create({
          data: {
            userId: reviewToken.entry.userId,
            type: 'METRIC_REJECTED',
            title: 'Metric Entry Not Approved',
            body: `Your ${reviewToken.entry.metric.name} entry (${reviewToken.entry.value} ${reviewToken.entry.metric.unit}) was not approved.`,
            data: JSON.stringify({
              entryId: reviewToken.entry.id,
              metricName: reviewToken.entry.metric.name,
              value: reviewToken.entry.value,
              unit: reviewToken.entry.metric.unit,
              reviewNotes: reviewNotes.trim(),
            }),
          },
        });
      });

      // Send rejection email
      if (reviewToken.entry.user.email) {
        const emailResult = await sendRejectionEmail(
          reviewToken.entry.user.email,
          {
            metric: reviewToken.entry.metric.name,
            value: reviewToken.entry.value,
            unit: reviewToken.entry.metric.unit,
          },
          reviewNotes.trim()
        );
        
        if (!emailResult.ok) {
          console.warn(`[WARN] Rejection email failed: ${emailResult.error}`);
        }
      }

      console.log(`[INFO] Entry ${reviewToken.entry.id} rejected by reviewer`);

      // Return success page
      return res.status(200).send(`
        <html>
          <head>
            <title>Entry Rejected - SpecimenStats</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .container {
                background: white;
                border-radius: 16px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 500px;
                width: 100%;
              }
              .reject-icon {
                font-size: 64px;
                margin-bottom: 20px;
              }
              h1 {
                color: #dc2626;
                margin-bottom: 16px;
                font-size: 32px;
              }
              .message {
                color: #6b7280;
                line-height: 1.6;
                margin: 20px 0;
              }
              .notes-box {
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 16px;
                margin: 20px 0;
                text-align: left;
              }
              .footer {
                color: #9ca3af;
                font-size: 14px;
                margin-top: 30px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="reject-icon">❌</div>
              <h1>Entry Rejected</h1>
              
              <div class="message">
                <p>The metric entry has been rejected and the user has been notified.</p>
              </div>
              
              <div class="notes-box">
                <strong>Rejection Reason:</strong><br>
                ${reviewNotes.trim()}
              </div>
              
              <div class="footer">
                <p>SpecimenStats Review System</p>
                <p>This review link has been deactivated.</p>
              </div>
            </div>
          </body>
        </html>
      `);

    } catch (error) {
      console.error('Rejection error:', error);
      return res.status(500).send(`
        <html>
          <head><title>Review Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <h1 style="color: #dc2626;">Review Error</h1>
            <p>An error occurred while processing the rejection.</p>
          </body>
        </html>
      `);
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
