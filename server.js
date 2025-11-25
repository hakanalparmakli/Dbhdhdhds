require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const ytdl = require('ytdl-core');
const path = require('path'); // Added for serving static files

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// --- Serve static files from the root directory ---
app.use(express.static(path.join(__dirname, '/')));

// API routes are now below the static file server
app.get('/search', async (req, res) => {
    console.log('Search request received with query:', req.query.q);
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
        console.error('Error searching YouTube:', error.response ? error.response.data : error.message);
        res.status(500).send({ error: 'Failed to search YouTube.' });
    }
});

app.get('/play/:videoId', (req, res) => {
    const { videoId } = req.params;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    if (!ytdl.validateID(videoId)) return res.status(400).send({ error: 'Invalid video ID.' });
    try {
        res.setHeader('Content-Type', 'audio/mpeg');
        ytdl(videoUrl, { filter: 'audioonly', quality: 'highestaudio' }).pipe(res);
    } catch (error) {
        console.error('Error streaming audio:', error);
        res.status(500).send({ error: 'Failed to process video.' });
    }
});

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
    console.log(`Access the app at http://localhost:${port}/index.html`);
});
