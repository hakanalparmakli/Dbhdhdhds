require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const axios = require('axios');
const ytdl = require('ytdl-core');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const saltRounds = 10;

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ users: [] }).write();

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// --- Updated Authentication Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    // If token is not in the header, check the query parameters (for audio streaming)
    if (token == null) {
        token = req.query.token;
    }

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.get('/', (req, res) => res.send('H-Sound backend is running!'));

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send({ error: 'Username and password are required.' });
    if (db.get('users').find({ username }).value()) return res.status(400).send({ error: 'Username already taken.' });
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        db.get('users').push({ username, password: hashedPassword }).write();
        res.status(201).send({ message: 'User created successfully.' });
    } catch (error) {
        res.status(500).send({ error: 'Failed to register user.' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send({ error: 'Username and password are required.' });
    const user = db.get('users').find({ username }).value();
    if (!user) return res.status(401).send({ error: 'Invalid username or password.' });
    try {
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            const accessToken = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ accessToken: accessToken });
        } else {
            res.status(401).send({ error: 'Invalid username or password.' });
        }
    } catch (error) {
        res.status(500).send({ error: 'Failed to log in.' });
    }
});

app.get('/search', authenticateToken, async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).send({ error: 'Search query is required.' });
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: { part: 'snippet', q, key: YOUTUBE_API_KEY, type: 'video', maxResults: 15 },
        });
        const results = response.data.items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.default.url,
        }));
        res.send(results);
    } catch (error) {
        res.status(500).send({ error: 'Failed to search YouTube.' });
    }
});

app.get('/play/:videoId', authenticateToken, (req, res) => {
    const { videoId } = req.params;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    if (!ytdl.validateID(videoId)) return res.status(400).send({ error: 'Invalid video ID.' });
    try {
        res.setHeader('Content-Type', 'audio/mpeg');
        ytdl(videoUrl, { filter: 'audioonly', quality: 'highestaudio' }).pipe(res);
    } catch (error) {
        res.status(500).send({ error: 'Failed to process video.' });
    }
});

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
