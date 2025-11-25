require('dotenv').config();
const express = require('express');
const cors = require('cors');
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
app.use(express.json());

// --- Serve static files from the root directory ---
app.use(express.static(path.join(__dirname, '/')));

// API routes are now below the static file server
app.get('/search', async (req, res) => {
    console.log('Search request received with query:', req.query.q);
    const { q } = req.query;
    if (!q) return res.status(400).send({ error: 'Search query is required.' });
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q,
                key: YOUTUBE_API_KEY,
                type: 'video',
                videoCategoryId: '10', // Filter for Music category
                maxResults: 15
            },
        });
        const results = response.data.items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.default.url,
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

// Endpoint to get popular music videos
app.get('/popular', async (req, res) => {
    console.log('Popular music request received');
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                part: 'snippet',
                chart: 'mostPopular',
                videoCategoryId: '10', // Music category
                regionCode: 'TR',      // Region code for Turkey
                maxResults: 20,
                key: YOUTUBE_API_KEY
            }
        });
        const results = response.data.items.map(item => ({
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

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
    console.log(`Access the app at http://localhost:${port}/index.html`);
});
