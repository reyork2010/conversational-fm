require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Use global fetch (Node.js v18+) or node-fetch for older versions
let fetch;
try {
  fetch = global.fetch || require('node-fetch');
} catch {
  fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;
  try {
    // Add a system prompt to instruct the AI to act as an interactive DJ that can control the music player
    const systemPrompt = `You are RichFM, an interactive AI DJ for a web music player. You can control playback (play, pause, stop, resume, next, previous) and respond conversationally. If the user asks to play, pause, stop, skip, or resume music, simply acknowledge and confirm the action, as the player will handle it. Do not say you cannot play music. If the user asks for info about the song, artist, or genre, answer conversationally.`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ]
      })
    });
    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      res.json({ reply: data.choices[0].message.content });
    } else if (data.error && data.error.message) {
      res.status(500).json({ reply: 'OpenAI error: ' + data.error.message });
    } else {
      res.status(500).json({ reply: 'AI server error: Unexpected response from OpenAI.' });
    }
  } catch (err) {
    res.status(500).json({ reply: 'AI server error: ' + err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));