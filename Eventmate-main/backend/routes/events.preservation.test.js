/**
 * Preservation Property Tests for Event Creation
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 * 
 * Property 2: Preservation - Existing Event Creation Behavior
 * For any event creation request, the POST /events endpoint SHALL continue to
 * validate and persist all existing fields exactly as before, with the same
 * validation rules, default values, status assignment, logging, and response format.
 * 
 * IMPORTANT: These tests run on UNFIXED code to establish baseline behavior.
 * They test event creation WITHOUT image_url to verify that all existing
 * functionality continues to work correctly.
 * 
 * EXPECTED OUTCOME ON UNFIXED CODE: These tests SHOULD PASS
 * This confirms the baseline behavior that must be preserved when implementing the fix.
 */

const request = require('supertest');
const fc = require('fast-check');
const db = require('../db');

// We need to set up the app without starting the server
process.env.NODE_ENV = 'test';
const app = require('../server');

describe('Preservation: Existing Event Creation Behavior', () => {
  let authToken;
  let organizerId;

  beforeAll(async () => {
    // Create a test organizer user
    const hashedPassword = require('bcryptjs').hashSync('testpass123', 10);
    const userResult = await db.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      ['Test Organizer Preservation', 'organizer-preservation@test.com', hashedPassword, 'Organizer', 'Active']
    );
    organizerId = userResult.rows[0].id;

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'organizer-preservation@test.com',
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
   * Property-Based Test: All Existing Fields Persist Correctly
   * 
   * This test generates random event data (WITHOUT image_url) and verifies that:
   * 1. All required fields are persisted to the database
   * 2. All fields in the response match the request
   * 3. Status is always 'Pending'
   * 4. Response format is correct (201 status, success/message/data structure)
   * 
   * EXPECTED OUTCOME: This test SHOULD PASS on unfixed code
   */
  test('Property: All existing fields persist correctly without image_url', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random event data with valid values
        fc.record({
          title: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
          description: fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          category: fc.constantFrom('Technology', 'Music', 'Sports', 'Arts', 'Business', 'Education'),
          date: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
            .map(d => d.toISOString().split('T')[0]),
          time: fc.constantFrom('09:00:00', '12:00:00', '15:00:00', '18:00:00', '20:00:00'),
          location_venue: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
          location_latitude: fc.double({ min: -90, max: 90, noNaN: true }),
          location_longitude: fc.double({ min: -180, max: 180, noNaN: true }),
          capacity: fc.integer({ min: 0, max: 10000 }),
          is_paid: fc.boolean()
        }),
        async (eventData) => {
          // Trim values to match validation middleware behavior
          const trimmedData = {
            ...eventData,
            title: eventData.title.trim(),
            description: eventData.description.trim(),
            location_venue: eventData.location_venue.trim()
          };

          // Create event WITHOUT image_url
          const response = await request(app)
            .post('/events')
            .set('Authorization', `Bearer ${authToken}`)
            .send(eventData)
            .expect(201);

          const createdEventId = response.body.data.event.id;

          // Query database directly to verify persistence
          const dbResult = await db.query(
            'SELECT * FROM events WHERE id = $1',
            [createdEventId]
          );

          const dbRecord = dbResult.rows[0];

          // Clean up
          await db.query('DELETE FROM events WHERE id = $1', [createdEventId]);

          // ASSERTIONS: Verify all existing fields persist correctly
          expect(dbRecord.title).toBe(trimmedData.title);
          expect(dbRecord.description).toBe(trimmedData.description);
          expect(dbRecord.category).toBe(trimmedData.category);
          expect(dbRecord.date.toISOString().split('T')[0]).toBe(trimmedData.date);
          expect(dbRecord.time).toBe(trimmedData.time);
          expect(dbRecord.location_venue).toBe(trimmedData.location_venue);
          expect(parseFloat(dbRecord.location_latitude)).toBeCloseTo(trimmedData.location_latitude, 5);
          expect(parseFloat(dbRecord.location_longitude)).toBeCloseTo(trimmedData.location_longitude, 5);
          expect(dbRecord.organizer_id).toBe(organizerId);
          expect(dbRecord.capacity).toBe(trimmedData.capacity);
          expect(dbRecord.is_paid).toBe(trimmedData.is_paid);
          
          // Verify status is always 'Pending'
          expect(dbRecord.status).toBe('Pending');
          
          // Verify response format
          expect(response.status).toBe(201);
          expect(response.body.success).toBe(true);
          expect(response.body.message).toBe('Event created successfully. Pending approval.');
          expect(response.body.data.event).toBeDefined();
          expect(response.body.data.event.id).toBe(createdEventId);
        }
      ),
      {
        numRuns: 20, // Run 20 test cases with different event data
        verbose: true
      }
    );
  });

  /**
   * Property-Based Test: Default Values Apply Correctly
   * 
   * This test verifies that default values for capacity and is_paid are applied
   * when these fields are not provided in the request.
   * 
   * EXPECTED OUTCOME: This test SHOULD PASS on unfixed code
   */
  test('Property: Default values apply (capacity=0, is_paid=false)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate event data WITHOUT capacity and is_paid, with valid values
        fc.record({
          title: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
          description: fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          category: fc.constantFrom('Technology', 'Music', 'Sports', 'Arts', 'Business', 'Education'),
          date: fc.integer({ min: 0, max: 729 })
            .map(days => {
              const baseDate = new Date('2024-01-01');
              baseDate.setDate(baseDate.getDate() + days);
              return baseDate.toISOString().split('T')[0];
            }),
          time: fc.constantFrom('09:00:00', '12:00:00', '15:00:00', '18:00:00', '20:00:00'),
          location_venue: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
          location_latitude: fc.double({ min: -90, max: 90, noNaN: true }),
          location_longitude: fc.double({ min: -180, max: 180, noNaN: true })
        }),
        async (eventData) => {
          // Create event without capacity and is_paid
          const response = await request(app)
            .post('/events')
            .set('Authorization', `Bearer ${authToken}`)
            .send(eventData)
            .expect(201);

          const createdEventId = response.body.data.event.id;

          // Query database directly
          const dbResult = await db.query(
            'SELECT capacity, is_paid FROM events WHERE id = $1',
            [createdEventId]
          );

          const dbRecord = dbResult.rows[0];

          // Clean up
          await db.query('DELETE FROM events WHERE id = $1', [createdEventId]);

          // ASSERTIONS: Verify default values
          expect(dbRecord.capacity).toBe(0);
          expect(dbRecord.is_paid).toBe(false);
        }
      ),
      {
        numRuns: 10,
        verbose: true
      }
    );
  });

  /**
   * Property-Based Test: Status is Always 'Pending'
   * 
   * This test verifies that all newly created events have status='Pending'
   * regardless of other field values.
   * 
   * EXPECTED OUTCOME: This test SHOULD PASS on unfixed code
   */
  test('Property: Status is always Pending for new events', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
          description: fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          category: fc.constantFrom('Technology', 'Music', 'Sports', 'Arts', 'Business', 'Education'),
          date: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
            .map(d => d.toISOString().split('T')[0]),
          time: fc.constantFrom('09:00:00', '12:00:00', '15:00:00', '18:00:00', '20:00:00'),
          location_venue: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
          location_latitude: fc.double({ min: -90, max: 90, noNaN: true }),
          location_longitude: fc.double({ min: -180, max: 180, noNaN: true }),
          capacity: fc.integer({ min: 0, max: 10000 }),
          is_paid: fc.boolean()
        }),
        async (eventData) => {
          const response = await request(app)
            .post('/events')
            .set('Authorization', `Bearer ${authToken}`)
            .send(eventData)
            .expect(201);

          const createdEventId = response.body.data.event.id;

          // Query database directly
          const dbResult = await db.query(
            'SELECT status FROM events WHERE id = $1',
            [createdEventId]
          );

          const dbRecord = dbResult.rows[0];

          // Clean up
          await db.query('DELETE FROM events WHERE id = $1', [createdEventId]);

          // ASSERTION: Status must always be 'Pending'
          expect(dbRecord.status).toBe('Pending');
          expect(response.body.data.event.status).toBe('Pending');
        }
      ),
      {
        numRuns: 15,
        verbose: true
      }
    );
  });

  /**
   * Property-Based Test: Response Format is Unchanged
   * 
   * This test verifies that the response structure remains consistent:
   * - 201 status code
   * - success: true
   * - message: 'Event created successfully. Pending approval.'
   * - data.event contains the created event
   * 
   * EXPECTED OUTCOME: This test SHOULD PASS on unfixed code
   */
  test('Property: Response format is unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
          description: fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          category: fc.constantFrom('Technology', 'Music', 'Sports', 'Arts', 'Business', 'Education'),
          date: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
            .map(d => d.toISOString().split('T')[0]),
          time: fc.constantFrom('09:00:00', '12:00:00', '15:00:00', '18:00:00', '20:00:00'),
          location_venue: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
          location_latitude: fc.double({ min: -90, max: 90, noNaN: true }),
          location_longitude: fc.double({ min: -180, max: 180, noNaN: true }),
          capacity: fc.integer({ min: 0, max: 10000 }),
          is_paid: fc.boolean()
        }),
        async (eventData) => {
          const response = await request(app)
            .post('/events')
            .set('Authorization', `Bearer ${authToken}`)
            .send(eventData);

          const createdEventId = response.body.data.event.id;

          // Clean up
          await db.query('DELETE FROM events WHERE id = $1', [createdEventId]);

          // ASSERTIONS: Verify response format
          expect(response.status).toBe(201);
          expect(response.body).toHaveProperty('success');
          expect(response.body.success).toBe(true);
          expect(response.body).toHaveProperty('message');
          expect(response.body.message).toBe('Event created successfully. Pending approval.');
          expect(response.body).toHaveProperty('data');
          expect(response.body.data).toHaveProperty('event');
          expect(response.body.data.event).toHaveProperty('id');
          expect(response.body.data.event).toHaveProperty('title');
          expect(response.body.data.event).toHaveProperty('description');
          expect(response.body.data.event).toHaveProperty('category');
          expect(response.body.data.event).toHaveProperty('status');
        }
      ),
      {
        numRuns: 10,
        verbose: true
      }
    );
  });

  /**
   * Concrete Example Test: Event Creation Without Optional Fields
   * 
   * This test verifies that events can be created with only required fields,
   * and optional fields get their default values.
   * 
   * EXPECTED OUTCOME: This test SHOULD PASS on unfixed code
   */
  test('Example: Event creation with minimal required fields', async () => {
    const eventData = {
      title: 'Minimal Event',
      description: 'Testing minimal event creation',
      category: 'Technology',
      date: '2024-12-31',
      time: '18:00:00',
      location_venue: 'Test Venue',
      location_latitude: 40.7128,
      location_longitude: -74.0060
      // capacity and is_paid omitted - should get defaults
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

    // ASSERTIONS
    expect(dbRecord.title).toBe(eventData.title);
    expect(dbRecord.description).toBe(eventData.description);
    expect(dbRecord.capacity).toBe(0); // Default value
    expect(dbRecord.is_paid).toBe(false); // Default value
    expect(dbRecord.status).toBe('Pending');
    expect(dbRecord.organizer_id).toBe(organizerId);
  });

  /**
   * Concrete Example Test: Event Creation With All Fields
   * 
   * This test verifies that events can be created with all fields provided.
   * 
   * EXPECTED OUTCOME: This test SHOULD PASS on unfixed code
   */
  test('Example: Event creation with all fields provided', async () => {
    const eventData = {
      title: 'Complete Event',
      description: 'Testing complete event creation with all fields',
      category: 'Music',
      date: '2024-12-25',
      time: '20:00:00',
      location_venue: 'Concert Hall',
      location_latitude: 40.7589,
      location_longitude: -73.9851,
      capacity: 500,
      is_paid: true
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

    // ASSERTIONS: All fields should match
    expect(dbRecord.title).toBe(eventData.title);
    expect(dbRecord.description).toBe(eventData.description);
    expect(dbRecord.category).toBe(eventData.category);
    expect(dbRecord.date.toISOString().split('T')[0]).toBe(eventData.date);
    expect(dbRecord.time).toBe(eventData.time);
    expect(dbRecord.location_venue).toBe(eventData.location_venue);
    expect(parseFloat(dbRecord.location_latitude)).toBeCloseTo(eventData.location_latitude, 5);
    expect(parseFloat(dbRecord.location_longitude)).toBeCloseTo(eventData.location_longitude, 5);
    expect(dbRecord.capacity).toBe(eventData.capacity);
    expect(dbRecord.is_paid).toBe(eventData.is_paid);
    expect(dbRecord.status).toBe('Pending');
    expect(dbRecord.organizer_id).toBe(organizerId);
  });

  /**
   * Concrete Example Test: Organizer ID Assignment
   * 
   * This test verifies that the organizer_id is correctly assigned from
   * the authenticated user (req.user.id).
   * 
   * EXPECTED OUTCOME: This test SHOULD PASS on unfixed code
   */
  test('Example: Organizer ID is correctly assigned from authenticated user', async () => {
    const eventData = {
      title: 'Organizer Test Event',
      description: 'Testing organizer ID assignment',
      category: 'Business',
      date: '2024-11-15',
      time: '10:00:00',
      location_venue: 'Business Center',
      location_latitude: 40.7484,
      location_longitude: -73.9857,
      capacity: 50,
      is_paid: false
    };

    const response = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send(eventData)
      .expect(201);

    const createdEventId = response.body.data.event.id;

    // Query database directly
    const dbResult = await db.query(
      'SELECT organizer_id FROM events WHERE id = $1',
      [createdEventId]
    );

    const dbRecord = dbResult.rows[0];

    // Clean up
    await db.query('DELETE FROM events WHERE id = $1', [createdEventId]);

    // ASSERTION: Organizer ID should match the authenticated user
    expect(dbRecord.organizer_id).toBe(organizerId);
    expect(response.body.data.event.organizer_id).toBe(organizerId);
  });
});
