require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const publicRoutes = require('./routes/public');
const bankRoutes = require('./routes/bank');
const adminFinanceRoutes = require('./routes/admin-finance');
// const ticketCategoryRoutes = require('./routes/ticket-categories');

const app = express();
const PORT = process.env.PORT || 3001;

const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:5173'],
        credentials: true
    }
});

// Initialize notify with the io instance
const { setIo } = require('./utils/notify');
setIo(io);

io.on('connection', (socket) => {
    console.log('Client connected to Socket.IO:', socket.id);

    socket.on('join', (userId) => {
        if (userId) {
            socket.join(`user_${userId}`);
            console.log(`Socket ${socket.id} joined room user_${userId}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected from Socket.IO:', socket.id);
    });
});

// Middleware
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173'];
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Eventmate API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/events', eventRoutes);
app.use('/admin', adminRoutes);
app.use('/notifications', notificationRoutes);
app.use('/public', publicRoutes);
app.use('/bank', bankRoutes);
app.use('/admin/finance', adminFinanceRoutes);
// app.use('/ticket-categories', ticketCategoryRoutes);

// Swagger documentation setup
let swaggerUi;
try {
    swaggerUi = require('swagger-ui-express');

    // Simple inline OpenAPI spec
    const swaggerSpec = {
        openapi: '3.0.0',
        info: {
            title: 'Eventmate API',
            version: '1.0.0',
            description: 'Location-based community event management system',
            contact: {
                name: 'API Support',
                email: 'support@eventmate.com'
            }
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{
            bearerAuth: []
        }],
        paths: {
            '/health': {
                get: {
                    summary: 'Health check endpoint',
                    responses: {
                        '200': {
                            description: 'Server is healthy'
                        }
                    }
                }
            },
            '/auth/register': {
                post: {
                    summary: 'Register a new user',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        email: { type: 'string' },
                                        password: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '201': { description: 'User created' }
                    }
                }
            },
            '/auth/login': {
                post: {
                    summary: 'Login user',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        email: { type: 'string' },
                                        password: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Login successful' }
                    }
                }
            }
        }
    };

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Eventmate API Documentation'
    }));

    console.log('Swagger UI available at: http://localhost:' + PORT + '/api-docs');
} catch (error) {
    console.log('Swagger not available:', error.message);
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Initialize database and start server
const startServer = async () => {
    try {
        // Test database connection
        const client = await db.pool.connect();
        console.log('Database connected successfully');
        client.release();

        // Initialize database schema (only in development)
        if (process.env.NODE_ENV !== 'production') {
            try {
                await db.initialize();
            } catch (initError) {
                console.log('Database initialization note:', initError.message);
            }
        }

        // Start the server using http server instance (supports socket.io)
        server.listen(PORT, () => {
            console.log(`\n========================================`);
            console.log(`Eventmate API Server Running`);
            console.log(`========================================`);
            console.log(`Port: ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Health Check: http://localhost:${PORT}/health`);
            if (swaggerUi) {
                console.log(`API Docs: http://localhost:${PORT}/api-docs`);
            }
            console.log(`========================================\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        console.log('\nPlease ensure:');
        console.log('1. PostgreSQL is running');
        console.log('2. Database "eventmate" exists or will be created');
        console.log('3. Environment variables are set in .env file');
        process.exit(1);
    }
};

startServer();

module.exports = app;
