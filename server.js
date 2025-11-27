require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const db = require('./database.js'); // Veritabanı kurulumunu ve bağlantısını dahil et
const axios = require('axios');
const path = require('path');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Exit if the API key is not provided, with a clear message.
if (!YOUTUBE_API_KEY) {
    console.error('FATAL ERROR: YOUTUBE_API_KEY is not defined in your .env file.');
    console.error('Please create a .env file and add your YouTube Data API key to it.');
    process.exit(1); // Exit the process with a failure code
}

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json()); // JSON body parser for parsing application/json

// API routes
app.get('/search', async (req, res) => {
    console.log('Search request received with query:', req.query.q);
    const { q } = req.query;
    if (!q) return res.status(400).send({ error: 'Search query is required.' });

    try {
        // Step 1: Search for videos to get their IDs
        const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
            },
            params: {
                part: 'snippet',
                q,
                key: YOUTUBE_API_KEY,
                type: 'video',
                videoCategoryId: '10', // Filter for Music category
                maxResults: 25 // Fetch more results to filter from
            },
        });

        const videoIds = searchResponse.data.items.map(item => item.id.videoId).join(',');
        if (!videoIds) {
            return res.send([]);
        }

        // Step 2: Get video details to check for embeddable status
        const detailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                part: 'snippet,status',
                id: videoIds,
                key: YOUTUBE_API_KEY
            }
        });

        // Step 3: Filter for embeddable videos and format them
        const embeddableVideos = detailsResponse.data.items.filter(item => item.status && item.status.embeddable === true);

        const results = embeddableVideos.map(item => ({
            videoId: item.id,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.default.url
        }));

        res.send(results);

    } catch (error) {
        console.error('Error searching YouTube:', error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 400) {
            return res.status(400).send({ error: 'Invalid or missing YouTube API key. Please check your .env file.' });
        }
        res.status(500).send({ error: 'Failed to search YouTube.' });
    }
});

// Endpoint to get popular music videos, now with embeddable check
app.get('/popular', async (req, res) => {
    console.log('Popular music request received');
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
            },
            params: {
                // Added 'status' to the part parameter to fetch embeddable status
                part: 'snippet,status',
                chart: 'mostPopular',
                videoCategoryId: '10', // Music category
                regionCode: 'US',      // Region code for the US
                maxResults: 20,
                key: YOUTUBE_API_KEY
            }
        });

        // Filter for embeddable videos before sending the response
        const embeddableVideos = response.data.items.filter(item => item.status && item.status.embeddable === true);

        const results = embeddableVideos.map(item => ({
            videoId: item.id,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.default.url,
        }));

        res.send(results);
    } catch (error) {
        console.error('Error fetching popular music:', error.response ? error.response.data : error.message);
        res.status(500).send({ error: 'Failed to fetch popular music.' });
    }
});

// --- Auth Routes ---
const saltRounds = 10;

// Register a new user
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';

        db.run(sql, [username, email, hashedPassword], function(err) {
            if (err) {
                // Check for unique constraint violation
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'Username or email already exists.' });
                }
                console.error('Error registering user:', err.message);
                return res.status(500).json({ error: 'Failed to register user.' });
            }
            console.log(`User ${username} registered with ID: ${this.lastID}`);
            res.status(201).json({ message: 'User registered successfully.' });
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// Login a user
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.get(sql, [email], async (err, user) => {
        if (err) {
            console.error('Error logging in user:', err.message);
            return res.status(500).json({ error: 'Failed to log in.' });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            res.status(200).json({ message: 'Login successful.' });
        } else {
            res.status(401).json({ error: 'Invalid credentials.' });
        }
    });
});

// Serve static files - Should be after all API routes
app.use(express.static(path.join(__dirname, '/')));


app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
    console.log(`Access the app at http://localhost:${port}/index.html`);
});
