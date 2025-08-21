import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/utils/prisma';
import { recomputeUserClassElo, recomputeOverallElo } from '@/lib/elo/recompute';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).send(`
        <html>
          <head><title>Invalid Review Link</title></head>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <h1 style="color: #dc2626;">Invalid Review Link</h1>
            <p>This review link is invalid or malformed.</p>
            <p>Please check the link and try again.</p>
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
                classId: true,
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
            <p>Review links can only be used once.</p>
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
            <p>Please contact the administrator for assistance.</p>
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
            <p>This entry has already been reviewed and is no longer pending.</p>
            <p>Status: <strong>${reviewToken.entry.status}</strong></p>
          </body>
        </html>
      `);
    }

    // Approve the entry
    await prisma.$transaction(async (tx) => {
      // Update entry status
      await tx.userMetricEntry.update({
        where: { id: reviewToken.entry.id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedById: 'system', // Could be replaced with actual reviewer ID
          reviewNotes: 'Approved via email review',
        },
      });

      // Delete the review token (one-time use)
      await tx.reviewToken.delete({
        where: { id: reviewToken.id },
      });

      // Create approval notification
      await tx.notification.create({
        data: {
          userId: reviewToken.entry.userId,
          type: 'METRIC_APPROVED',
          title: 'Metric Entry Approved! 🎉',
          body: `Your ${reviewToken.entry.metric.name} entry (${reviewToken.entry.value} ${reviewToken.entry.metric.unit}) has been approved and added to your profile.`,
          data: JSON.stringify({
            entryId: reviewToken.entry.id,
            metricName: reviewToken.entry.metric.name,
            value: reviewToken.entry.value,
            unit: reviewToken.entry.metric.unit,
          }),
        },
      });
    });

    // Trigger ELO recalculation
    try {
      await recomputeUserClassElo(reviewToken.entry.userId, reviewToken.entry.metric.classId);
      await recomputeOverallElo(reviewToken.entry.userId);
      console.log(`[INFO] ELO recomputed for user ${reviewToken.entry.userId} after approval`);
    } catch (eloError) {
      console.error('[ERROR] Failed to recompute ELO after approval:', eloError);
    }

    console.log(`[INFO] Entry ${reviewToken.entry.id} approved by reviewer`);

    // Return success page
    return res.status(200).send(`
      <html>
        <head>
          <title>Entry Approved - SpecimenStats</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            .success-icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
            h1 {
              color: #10b981;
              margin-bottom: 16px;
              font-size: 32px;
            }
            .entry-details {
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
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
              color: #059669;
              font-weight: 500;
            }
            .message {
              color: #6b7280;
              line-height: 1.6;
              margin: 20px 0;
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
            <div class="success-icon">✅</div>
            <h1>Entry Approved!</h1>
            
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
            </div>
            
            <div class="message">
              <p>This metric entry has been successfully approved and added to the user's profile.</p>
              <p>The user will receive a notification about this approval, and their ELO ratings have been updated.</p>
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
    console.error('Approval error:', error);
    return res.status(500).send(`
      <html>
        <head><title>Review Error</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #dc2626;">Review Error</h1>
          <p>An error occurred while processing the approval.</p>
          <p>Please try again or contact the administrator.</p>
        </body>
      </html>
    `);
  }
}
