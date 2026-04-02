/**
 * Database Seed Script
 * Run with: node back/db/seed.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'eventmate_db',
    user: process.env.DB_USER || 'Yordanos',
    password: process.env.DB_PASSWORD || ''
});

const bcrypt = require('bcryptjs');

async function seed() {
    console.log('🌱 Starting database seed...\n');

    const client = await pool.connect();

    try {
        // Seed Users
        console.log('👥 Seeding users...');

        // Admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        await client.query(
            `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
            ['Admin User', 'admin@eventmate.com', adminPassword, 'Administrator']
        );

        // Organizer user
        const organizerPassword = await bcrypt.hash('organizer123', 10);
        await client.query(
            `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
            ['John Organizer', 'organizer@eventmate.com', organizerPassword, 'Organizer']
        );

        // Another Organizer
        await client.query(
            `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
            ['Sarah Events', 'sarah@eventmate.com', organizerPassword, 'Organizer']
        );

        // Regular users
        const userPassword = await bcrypt.hash('user123', 10);
        const users = [
            { name: 'Alice Johnson', email: 'alice@example.com' },
            { name: 'Bob Smith', email: 'bob@example.com' },
            { name: 'Charlie Brown', email: 'charlie@example.com' },
            { name: 'Diana Prince', email: 'diana@example.com' },
            { name: 'Eve Wilson', email: 'eve@example.com' }
        ];

        for (const user of users) {
            await client.query(
                `INSERT INTO users (name, email, password_hash, role) 
         VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
                [user.name, user.email, userPassword, 'Registered User']
            );
        }
        console.log('✓ Users seeded\n');

        // Get user IDs
        const usersResult = await client.query('SELECT id, email, role FROM users');
        const userMap = {};
        usersResult.rows.forEach(u => { userMap[u.email] = u.id; });

        // Seed Events
        console.log('📅 Seeding events...');
        const events = [
            {
                title: 'Tech Conference 2026',
                description: 'Annual technology conference featuring the latest innovations in AI, blockchain, and cloud computing.',
                date: '2026-04-15',
                time: '09:00',
                location_venue: 'Grand Convention Hall, Convention Center, Downtown',
                category: 'Technology',
                capacity: 500,
                organizer: 'organizer@eventmate.com',
                is_paid: true,
                status: 'Approved'
            },
            {
                title: 'Summer Music Festival',
                description: 'Three days of live music featuring top artists from around the world.',
                date: '2026-06-20',
                time: '14:00',
                location_venue: 'Central Park Amphitheater, Central Park',
                category: 'Music',
                capacity: 2000,
                organizer: 'organizer@eventmate.com',
                is_paid: true,
                status: 'Approved'
            },
            {
                title: 'Startup Networking Night',
                description: 'Connect with fellow entrepreneurs and investors at this exclusive networking event.',
                date: '2026-03-25',
                time: '18:00',
                location_venue: 'Tech Hub Building, The Innovation Hub',
                category: 'Business',
                capacity: 100,
                organizer: 'sarah@eventmate.com',
                is_paid: true,
                status: 'Approved'
            },
            {
                title: 'Yoga in the Park',
                description: 'Start your weekend with a refreshing outdoor yoga session suitable for all levels.',
                date: '2026-03-08',
                time: '07:00',
                location_venue: 'Park Lawn Area, Riverside Park',
                category: 'Health',
                capacity: 50,
                organizer: 'sarah@eventmate.com',
                is_paid: true,
                status: 'Approved'
            },
            {
                title: 'Art Gallery Opening',
                description: 'Exclusive opening night of the contemporary art exhibition featuring local artists.',
                date: '2026-03-28',
                time: '19:00',
                location_venue: 'Downtown Gallery, Modern Art Gallery',
                category: 'Art',
                capacity: 150,
                organizer: 'organizer@eventmate.com',
                is_paid: false,
                status: 'Approved'
            },
            {
                title: 'Web Development Workshop',
                description: 'Hands-on workshop covering modern web development with React and Node.js.',
                date: '2026-04-05',
                time: '10:00',
                location_venue: 'Training Room A, Code Academy',
                category: 'Education',
                capacity: 30,
                organizer: 'organizer@eventmate.com',
                is_paid: true,
                status: 'Approved'
            },
            {
                title: 'Food Truck Festival',
                description: 'Sample cuisines from over 30 local food trucks at this family-friendly event.',
                date: '2026-05-10',
                time: '11:00',
                location_venue: 'Main Parking Lot, Fairgrounds',
                category: 'Food',
                capacity: 3000,
                organizer: 'sarah@eventmate.com',
                is_paid: true,
                status: 'Approved'
            },
            {
                title: 'Marathon Charity Run',
                description: 'Annual charity marathon supporting local children\'s hospitals. All skill levels welcome!',
                date: '2026-05-15',
                time: '06:00',
                location_venue: 'Stadium Track, City Stadium',
                category: 'Sports',
                capacity: 1000,
                organizer: 'organizer@eventmate.com',
                is_paid: true,
                status: 'Approved'
            },
            {
                title: 'AI & Machine Learning Summit',
                description: 'Deep dive into AI trends with industry experts and hands-on demos.',
                date: '2026-04-22',
                time: '08:30',
                location_venue: 'Main Auditorium, Tech Campus',
                category: 'Technology',
                capacity: 300,
                organizer: 'organizer@eventmate.com',
                is_paid: true,
                status: 'Approved'
            },
            {
                title: 'Jazz Night',
                description: 'An evening of smooth jazz with renowned local and international artists.',
                date: '2026-03-21',
                time: '20:00',
                location_venue: 'Main Stage, Blue Note Jazz Club',
                category: 'Music',
                capacity: 120,
                organizer: 'sarah@eventmate.com',
                is_paid: true,
                status: 'Approved'
            },
            {
                title: 'Cooking Class: Italian Cuisine',
                description: 'Learn to make authentic Italian dishes from a professional chef.',
                date: '2026-04-12',
                time: '17:00',
                location_venue: 'Demo Kitchen, Culinary Institute',
                category: 'Food',
                capacity: 20,
                organizer: 'sarah@eventmate.com',
                is_paid: true,
                status: 'Approved'
            },
            {
                title: 'Business Leadership Seminar',
                description: 'Keynote presentation on leadership strategies for the modern business world.',
                date: '2026-04-18',
                time: '13:00',
                location_venue: 'Conference Hall B, Business Center',
                category: 'Business',
                capacity: 200,
                organizer: 'organizer@eventmate.com',
                is_paid: true,
                status: 'Approved'
            }
        ];

        for (const event of events) {
            const organizerId = userMap[event.organizer];

            if (organizerId) {
                const result = await client.query(
                    `INSERT INTO events (title, description, date, time, location_venue, category, capacity, organizer_id, is_paid, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT DO NOTHING RETURNING id`,
                    [
                        event.title,
                        event.description,
                        event.date,
                        event.time,
                        event.location_venue,
                        event.category,
                        event.capacity,
                        organizerId,
                        event.is_paid,
                        event.status
                    ]
                );

                if (result.rows.length > 0 && event.is_paid) {
                    const eventId = result.rows[0].id;
                    // Add default ticket categories for paid events
                    await client.query(
                        `INSERT INTO ticket_categories (event_id, name, price, capacity)
                         VALUES ($1, $2, $3, $4), ($1, $5, $6, $7)`,
                        [
                            eventId,
                            'General Admission', 25.00, Math.floor(event.capacity * 0.8),
                            'VIP', 75.00, Math.floor(event.capacity * 0.2)
                        ]
                    );
                }
            }
        }
        console.log('✓ Events and Ticket Categories seeded\n');

        // Get event IDs
        const eventsResult = await client.query('SELECT id, title FROM events');
        const eventMap = {};
        eventsResult.rows.forEach(e => { eventMap[e.title] = e.id; });

        // Seed Registrations (some users register for events)
        console.log('📝 Seeding event registrations...');
        const registrations = [
            { email: 'alice@example.com', event: 'Tech Conference 2026' },
            { email: 'alice@example.com', event: 'Summer Music Festival' },
            { email: 'alice@example.com', event: 'Jazz Night' },
            { email: 'bob@example.com', event: 'Tech Conference 2026' },
            { email: 'bob@example.com', event: 'Startup Networking Night' },
            { email: 'charlie@example.com', event: 'Yoga in the Park' },
            { email: 'charlie@example.com', event: 'Marathon Charity Run' },
            { email: 'diana@example.com', event: 'Art Gallery Opening' },
            { email: 'diana@example.com', event: 'Web Development Workshop' },
            { email: 'eve@example.com', event: 'Food Truck Festival' },
            { email: 'eve@example.com', event: 'Marathon Charity Run' }
        ];

        for (const reg of registrations) {
            const userId = userMap[reg.email];
            const eventId = eventMap[reg.event];

            if (userId && eventId) {
                await client.query(
                    `INSERT INTO registrations (user_id, event_id, status, timestamp)
           VALUES ($1, $2, $3, NOW()) ON CONFLICT (user_id, event_id) DO NOTHING`,
                    [userId, eventId, 'RSVPed']
                );
            }
        }
        console.log('✓ Registrations seeded\n');

        // Seed Favorites
        console.log('❤️ Seeding favorites...');
        const favorites = [
            { email: 'alice@example.com', event: 'Tech Conference 2026' },
            { email: 'alice@example.com', event: 'AI & Machine Learning Summit' },
            { email: 'bob@example.com', event: 'Summer Music Festival' },
            { email: 'charlie@example.com', event: 'Marathon Charity Run' },
            { email: 'diana@example.com', event: 'Art Gallery Opening' },
            { email: 'diana@example.com', event: 'Web Development Workshop' },
            { email: 'eve@example.com', event: 'Food Truck Festival' }
        ];

        for (const fav of favorites) {
            const userId = userMap[fav.email];
            const eventId = eventMap[fav.event];

            if (userId && eventId) {
                await client.query(
                    `INSERT INTO favorites (user_id, event_id, created_at)
           VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`,
                    [userId, eventId]
                );
            }
        }
        console.log('✓ Favorites seeded\n');

        // Seed Notifications
        console.log('🔔 Seeding notifications...');
        const notifications = [
            {
                user: 'organizer@eventmate.com',
                message: 'Someone registered for Tech Conference 2026'
            },
            {
                user: 'organizer@eventmate.com',
                message: 'Your event "Summer Music Festival" has been approved'
            },
            {
                user: 'alice@example.com',
                message: 'Tech Conference 2026 is coming up soon!'
            },
            {
                user: 'sarah@eventmate.com',
                message: 'A user added your event to their favorites'
            }
        ];

        for (const notif of notifications) {
            const userId = userMap[notif.user];
            if (userId) {
                await client.query(
                    `INSERT INTO notifications (user_id, message, is_read, sent_at)
                     VALUES ($1, $2, $3, NOW()) ON CONFLICT DO NOTHING`,
                    [userId, notif.message, false]
                );
            }
        }
        console.log('✓ Notifications seeded\n');

        console.log('🎉 Database seeding completed successfully!\n');
        console.log('📋 Test Accounts:');
        console.log('   Admin: admin@eventmate.com / admin123');
        console.log('   Organizer: organizer@eventmate.com / organizer123');
        console.log('   Organizer: sarah@eventmate.com / organizer123');
        console.log('   User: alice@example.com / user123');
        console.log('   User: bob@example.com / user123');
        console.log('');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seed().catch(console.error);
