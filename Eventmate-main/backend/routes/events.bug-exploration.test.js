/**
 * Bug Condition Exploration Test for Event Image Persistence
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * Property 1: Bug Condition - Image URL Persistence
 * For any event creation request where image_url is provided in the request body,
 * the POST /events endpoint SHALL persist the image_url value to the database
 * and return it in the created event object.
 * 
 * This test uses property-based testing to generate various image URLs and verify
 * that they are persisted correctly. On UNFIXED code, this test will FAIL because
 * the image_url field is not being extracted from req.body and is not included
 * in the INSERT query.
 */

const request = require('supertest');
const fc = require('fast-check');
const db = require('../db');

// We need to set up the app without starting the server
process.env.NODE_ENV = 'test';
const app = require('../server');

describe('Bug Exploration: Event Image URL Persistence', () => {
  let authToken;
  let organizerId;

  beforeAll(async () => {
    // Create a test organizer user
    const hashedPassword = require('bcryptjs').hashSync('testpass123', 10);
    const userResult = await db.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      ['Test Organizer', 'organizer@test.com', hashedPassword, 'Organizer', 'Active']
    );
    organizerId = userResult.rows[0].id;

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'organizer@test.com',
        password: 'testpass123'
      });
    
    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    await db.query('DELETE FROM events WHERE organizer_id = $1', [organizerId]);
    await db.query('DELETE FROM users WHERE id = $1', [organizerId]);
    await db.pool.end();
  });

  /**
   * Property-Based Test: Image URL Persistence
   * 
   * This test generates random image URLs and verifies that when an event is created
   * with an image_url in the request body, the image_url is:
   * 1. Persisted to the database
   * 2. Returned in the API response
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: This test will FAIL
   * - The database will show image_url as NULL
   * - The API response may show image_url as NULL or undefined
   * 
   * This failure is CORRECT - it proves the bug exists.
   */
  test('Property: POST /events with image_url SHALL persist image_url to database', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various image URL formats
        fc.oneof(
          fc.constant('/uploads/event-image-123.jpg'),
          fc.constant('/uploads/test.png'),
          fc.constant('https://example.com/image.jpg'),
          fc.constant('https://cdn.example.com/events/photo.png'),
          fc.webUrl({ withFragments: false, withQueryParameters: false })
            .map(url => url + '/image.jpg')
        ),
        async (imageUrl) => {
          // Create event with image_url
          const eventData = {
            title: 'Test Event with Image',
            description: 'Testing image URL persistence',
            category: 'Technology',
            date: '2024-12-31',
            time: '18:00:00',
            location_venue: 'Test Venue',
            location_latitude: 40.7128,
            location_longitude: -74.0060,
            capacity: 100,
            is_paid: false,
            image_url: imageUrl
          };

          // Make POST request
          const response = await request(app)
            .post('/events')
            .set('Authorization', `Bearer ${authToken}`)
            .send(eventData)
            .expect(201);

          const createdEventId = response.body.data.event.id;

          // Query database directly to verify persistence
          const dbResult = await db.query(
            'SELECT image_url FROM events WHERE id = $1',
            [createdEventId]
          );

          const dbRecord = dbResult.rows[0];

          // Clean up
          await db.query('DELETE FROM events WHERE id = $1', [createdEventId]);

          // ASSERTIONS: These will FAIL on unfixed code
          // 1. Database should contain the image_url
          expect(dbRecord.image_url).toBe(imageUrl);
          
          // 2. API response should include the image_url
          expect(response.body.data.event.image_url).toBe(imageUrl);
        }
      ),
      {
        numRuns: 10, // Run 10 test cases with different image URLs
        verbose: true // Show counterexamples when test fails
      }
    );
  });

  /**
   * Concrete Example Test: Uploaded Image Path
   * 
   * This test uses a concrete example of an uploaded image path (the most common case).
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: This test will FAIL
   * - Database query will show image_url = NULL
   * - API response will show image_url = NULL or undefined
   */
  test('Example: Event with uploaded image path /uploads/event123.jpg', async () => {
    const imageUrl = '/uploads/event123.jpg';
    
    const eventData = {
      title: 'Event with Uploaded Image',
      description: 'Testing uploaded image persistence',
      category: 'Music',
      date: '2024-12-25',
      time: '20:00:00',
      location_venue: 'Concert Hall',
      location_latitude: 40.7589,
      location_longitude: -73.9851,
      capacity: 500,
      is_paid: true,
      image_url: imageUrl
    };

    const response = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send(eventData)
      .expect(201);

    const createdEventId = response.body.data.event.id;

    // Query database directly
    const dbResult = await db.query(
      'SELECT * FROM events WHERE id = $1',
      [createdEventId]
    );

    const dbRecord = dbResult.rows[0];

    // Clean up
    await db.query('DELETE FROM events WHERE id = $1', [createdEventId]);

    // ASSERTIONS: These will FAIL on unfixed code
    expect(dbRecord.image_url).toBe(imageUrl);
    expect(response.body.data.event.image_url).toBe(imageUrl);
  });

  /**
   * Concrete Example Test: External Image URL
   * 
   * This test uses an external image URL.
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: This test will FAIL
   */
  test('Example: Event with external image URL', async () => {
    const imageUrl = 'https://example.com/events/summer-festival.jpg';
    
    const eventData = {
      title: 'Summer Festival',
      description: 'Annual summer music festival',
      category: 'Music',
      date: '2024-07-15',
      time: '14:00:00',
      location_venue: 'City Park',
      location_latitude: 40.7829,
      location_longitude: -73.9654,
      capacity: 1000,
      is_paid: true,
      image_url: imageUrl
    };

    const response = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send(eventData)
      .expect(201);

    const createdEventId = response.body.data.event.id;

    // Query database directly
    const dbResult = await db.query(
      'SELECT image_url FROM events WHERE id = $1',
      [createdEventId]
    );

    const dbRecord = dbResult.rows[0];

    // Clean up
    await db.query('DELETE FROM events WHERE id = $1', [createdEventId]);

    // ASSERTIONS: These will FAIL on unfixed code
    expect(dbRecord.image_url).toBe(imageUrl);
    expect(response.body.data.event.image_url).toBe(imageUrl);
  });
});
