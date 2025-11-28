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
const nodemailer = require('nodemailer');
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
app.use(express.static(__dirname));

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
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).send({ error: 'Username, email, and password are required.' });
    if (db.get('users').find({ username }).value()) return res.status(400).send({ error: 'Username already taken.' });
    if (db.get('users').find({ email }).value()) return res.status(400).send({ error: 'Email already in use.' });
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const users = db.get('users').value();
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            username,
            email,
            password: hashedPassword
        };
        db.get('users').push(newUser).write();
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


app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});

// --- Password Reset Routes ---
app.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    const user = db.get('users').find({ email }).value();
    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
    const resetLink = `http://localhost:3000/reset-password.html?token=${token}`;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset',
        text: `Click here to reset your password: ${resetLink}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ error: 'Failed to send reset email.' });
        }
        res.status(200).json({ message: 'Password reset email sent.' });
    });
});

app.post('/reset-password', (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required.' });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            db.get('users').find({ id: decoded.id }).assign({ password: hashedPassword }).write();
            res.status(200).json({ message: 'Password updated successfully.' });
        } catch (error) {
            console.error('Error hashing password:', error);
            res.status(500).json({ error: 'Server error during password reset.' });
        }
    });
});
