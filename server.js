require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('H-Sound backend is running!'));

app.get('/search', async (req, res) => {
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
        console.error('Error searching YouTube:', error);
        res.status(500).send({ error: 'Failed to search YouTube.' });
    }
});

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
