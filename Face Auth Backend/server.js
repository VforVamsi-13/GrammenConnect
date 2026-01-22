require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 5000;

// Helper to calculate Euclidean distance between two embeddings
const getEuclideanDistance = (arr1, arr2) => {
    if (arr1.length !== arr2.length) return Infinity;
    return Math.sqrt(
        arr1.reduce((sum, val, i) => sum + Math.pow(val - arr2[i], 2), 0)
    );
};

// POST /register-face
app.post('/register-face', async (req, res) => {
    const { name, embedding } = req.body;

    if (!name || !embedding || !Array.isArray(embedding)) {
        return res.status(400).json({ error: 'Name and embedding are required' });
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .insert([{ name, face_embedding: embedding }])
            .select();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        res.status(201).json({ message: 'User registered successfully', user: data[0] });
    } catch (err) {
        console.error('Registration error detailed:', err);
        res.status(500).json({ error: err.message || 'Failed to register user' });
    }
});

const loginAttempts = new Map();

// POST /login-face
app.post('/login-face', async (req, res) => {
    const { embedding } = req.body;
    const ip = req.ip;

    // Simple rate limit: 10 attempts per IP per 5 minutes
    const now = Date.now();
    const attempts = loginAttempts.get(ip) || [];
    const recentAttempts = attempts.filter(time => now - time < 5 * 60 * 1000);

    if (recentAttempts.length >= 10) {
        return res.status(429).json({ error: 'Too many login attempts. Please wait 5 minutes.' });
    }

    recentAttempts.push(now);
    loginAttempts.set(ip, recentAttempts);

    if (!embedding || !Array.isArray(embedding)) {
        return res.status(400).json({ error: 'Embedding is required' });
    }

    try {
        // For a hackathon demo, we fetch all users and compare locally.
        // In production, use pgvector or a specialized vector DB.
        const { data: users, error } = await supabase
            .from('users')
            .select('id, name, face_embedding');

        if (error) throw error;

        let bestMatch = null;
        let minDistance = 0.6; // Configurable threshold

        for (const user of users) {
            const distance = getEuclideanDistance(embedding, user.face_embedding);
            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = user;
            }
        }

        if (bestMatch) {
            res.json({
                message: 'Login successful',
                user: { id: bestMatch.id, name: bestMatch.name },
                distance: minDistance
            });
        } else {
            res.status(401).json({ error: 'Face not recognized. Please register or try again.' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
