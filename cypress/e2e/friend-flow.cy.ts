describe('Friend Management Flow', () => {
  beforeEach(() => {
    // Visit the app and log in as test user
    cy.visit('/auth/login');
    cy.get('[data-testid=email-input]').type('test@specimenstats.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=login-button]').click();
    
    // Wait for redirect to dashboard
    cy.url().should('include', '/');
  });

  it('should complete full friend request flow', () => {
    // Navigate to friends page
    cy.visit('/friends');
    cy.contains('Friends').should('be.visible');

    // Search for a user
    cy.get('[data-testid=search-input]').type('Alice Strong');
    cy.get('[data-testid=search-button]').click();

    // Should see search results
    cy.contains('Alice Strong').should('be.visible');
    cy.contains('ELO:').should('be.visible');

    // Send friend request
    cy.get('[data-testid=add-friend-button]').first().click();
    cy.contains('Friend request sent!').should('be.visible');

    // User should disappear from search results
    cy.contains('Alice Strong').should('not.exist');

    // Switch to requests tab to see outgoing requests would be visible to Alice
    // (In a real test, you'd log in as Alice to check)

    // Navigate to notifications to check for any updates
    cy.visit('/notifications');
    
    // Should see the page load successfully
    cy.contains('Notifications').should('be.visible');
  });

  it('should handle friend request acceptance', () => {
    // Navigate to friends page
    cy.visit('/friends');

    // Go to requests tab
    cy.get('[data-testid=requests-tab]').click();

    // Should see pending requests (if any exist from seeded data)
    cy.get('[data-testid=friend-request]').should('exist');

    // Accept a friend request
    cy.get('[data-testid=accept-request-button]').first().click();
    cy.contains('Friend request accepted!').should('be.visible');

    // Switch to friends tab
    cy.get('[data-testid=friends-tab]').click();

    // Should see the new friend in the list
    cy.get('[data-testid=friend-item]').should('exist');
    cy.get('[data-testid=compare-button]').should('exist');
  });

  it('should navigate to comparison page', () => {
    // Navigate to friends page
    cy.visit('/friends');

    // Go to friends tab
    cy.get('[data-testid=friends-tab]').click();

    // Click compare button for first friend
    cy.get('[data-testid=compare-button]').first().click();

    // Should navigate to comparison page
    cy.url().should('include', '/compare/');
    cy.contains('Stats Comparison').should('be.visible');
    cy.contains('Overall ELO Difference').should('be.visible');
    cy.contains('Key Metrics Comparison').should('be.visible');
  });

  it('should handle friend removal', () => {
    // Navigate to friends page
    cy.visit('/friends');

    // Go to friends tab
    cy.get('[data-testid=friends-tab]').click();

    // Count initial friends
    cy.get('[data-testid=friend-item]').then($friends => {
      const initialCount = $friends.length;

      // Remove a friend
      cy.get('[data-testid=remove-friend-button]').first().click();
      
      // Confirm deletion in the browser dialog
      // Note: Cypress automatically accepts confirm() dialogs

      cy.contains('Friend removed').should('be.visible');

      // Should have one less friend
      cy.get('[data-testid=friend-item]').should('have.length', initialCount - 1);
    });
  });
});

describe('Leaderboard Navigation and Search', () => {
  beforeEach(() => {
    cy.visit('/auth/login');
    cy.get('[data-testid=email-input]').type('test@specimenstats.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=login-button]').click();
  });

  it('should navigate leaderboards and handle search/jump', () => {
    // Navigate to leaderboards
    cy.visit('/leaderboards');
    cy.contains('Leaderboards').should('be.visible');

    // Should see list of metrics
    cy.get('[data-testid=metric-card]').should('exist');

    // Click on a specific metric leaderboard
    cy.get('[data-testid=metric-card]').first().click();

    // Should navigate to specific metric leaderboard
    cy.url().should('include', '/leaderboard/');
    cy.contains('Leaderboard').should('be.visible');

    // Should see ranked users
    cy.get('[data-testid=leaderboard-entry]').should('exist');
    cy.contains('#1').should('be.visible');

    // Test search functionality
    cy.get('[data-testid=search-input]').type('Alice');
    cy.get('[data-testid=search-button]').click();

    // Should filter results or show search results
    cy.get('[data-testid=leaderboard-entry]').should('exist');

    // Test jump to rank functionality
    cy.get('[data-testid=jump-to-rank-input]').type('5');
    cy.get('[data-testid=jump-button]').click();

    // Should scroll to or highlight rank 5
    cy.contains('#5').should('be.visible');
  });
});

describe('Gym Selection on Map', () => {
  beforeEach(() => {
    cy.visit('/auth/login');
    cy.get('[data-testid=email-input]').type('test@specimenstats.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=login-button]').click();
  });

  it('should set gym from map', () => {
    // Navigate to map
    cy.visit('/map');
    cy.contains('Find Gyms').should('be.visible');

    // Wait for map to load
    cy.get('[data-testid=gym-map]').should('be.visible');

    // Click on a gym marker (this would require specific map testing setup)
    cy.get('[data-testid=gym-marker]').first().click();

    // Should show gym details
    cy.get('[data-testid=gym-details]').should('be.visible');
    cy.contains('Set as My Gym').should('be.visible');

    // Set as current gym
    cy.get('[data-testid=set-gym-button]').click();
    cy.contains('Gym updated successfully!').should('be.visible');

    // Navigate to profile or dashboard to verify gym change
    cy.visit('/');
    cy.contains('Current Gym').should('be.visible');
  });
});

describe('Video Review Workflow', () => {
  beforeEach(() => {
    // Log in as admin user
    cy.visit('/auth/login');
    cy.get('[data-testid=email-input]').type('admin@specimenstats.com');
    cy.get('[data-testid=password-input]').type('admin123');
    cy.get('[data-testid=login-button]').click();
  });

  it('should handle video rejection with notes', () => {
    // Navigate to admin videos page
    cy.visit('/admin/videos');
    cy.contains('Video Review').should('be.visible');

    // Should see pending videos
    cy.get('[data-testid=pending-video]').should('exist');

    // Click on first video to review
    cy.get('[data-testid=review-video-button]').first().click();

    // Should show video player and review controls
    cy.get('[data-testid=video-player]').should('be.visible');
    cy.get('[data-testid=approve-button]').should('be.visible');
    cy.get('[data-testid=reject-button]').should('be.visible');

    // Add rejection notes
    cy.get('[data-testid=review-notes]').type('Video quality is too low. Please resubmit with better lighting.');

    // Reject the video
    cy.get('[data-testid=reject-button]').click();
    cy.contains('Video rejected successfully').should('be.visible');

    // Video should disappear from pending list
    cy.visit('/admin/videos');
    // The rejected video should not appear in pending anymore
  });

  it('should handle video approval', () => {
    cy.visit('/admin/videos');
    
    // Approve a video
    cy.get('[data-testid=review-video-button]').first().click();
    cy.get('[data-testid=approve-button]').click();
    cy.contains('Video approved successfully').should('be.visible');

    // Should create notification for user
    // (In a real test, you'd log in as that user and check notifications)
  });
});

describe('Notification System', () => {
  beforeEach(() => {
    cy.visit('/auth/login');
    cy.get('[data-testid=email-input]').type('test@specimenstats.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=login-button]').click();
  });

  it('should display and manage notifications', () => {
    // Navigate to notifications
    cy.visit('/notifications');
    cy.contains('Notifications').should('be.visible');

    // Should see notifications list
    cy.get('[data-testid=notification-item]').should('exist');

    // Mark notification as read
    cy.get('[data-testid=notification-item]').first().click();
    
    // Notification should be marked as read (visual change)
    cy.get('[data-testid=notification-item]').first().should('have.class', 'read');

    // Test mark all as read
    cy.get('[data-testid=mark-all-read-button]').click();
    cy.contains('All notifications marked as read').should('be.visible');

    // All notifications should be marked as read
    cy.get('[data-testid=notification-item].unread').should('not.exist');
  });
});
