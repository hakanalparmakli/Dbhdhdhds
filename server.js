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
app.use(express.json()); // JSON body parser for parsing application/json

// Serve static files from the root directory. This should come before API routes.
app.use(express.static(path.join(__dirname, '/')));

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

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
    console.log(`Access the app at http://localhost:${port}/index.html`);
});
