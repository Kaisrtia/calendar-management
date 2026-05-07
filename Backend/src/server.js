const express = require('express');
const cors = require('cors');
require('dotenv').config();

const appointmentRoutes = require('./routes/appointmentRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routing
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', userRoutes);

// General connection check
app.get('/health', (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date() });
});

// App Listener
const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// Handle EADDRINUSE by using next available port
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        const fallbackPort = PORT + 1;
        console.log(`Port ${PORT} is in use, trying port ${fallbackPort}...`);
        app.listen(fallbackPort, () => {
            console.log(`Server listening on port ${fallbackPort}`);
        });
    }
});
