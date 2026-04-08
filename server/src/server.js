import express from 'express';
import cors from 'cors';
import multer from 'multer';
import 'dotenv/config';
import { callAi, transcribeAudio, textToSpeech } from './ai.service.js';
const app = express();
app.use(
  cors({
    origin: '*',
  })
);
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });
const port = process.env.PORT || 5001;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/ask', async (req, res) => {
  const { answer, prevQuestion } = req.body;
  const response = await callAi({ answer, prevQuestion });
  res.json({ response });
});

app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const text = await transcribeAudio(req.file.buffer, req.file.mimetype);
    res.json({ text });
  } catch (err) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

app.post('/speak', async (req, res) => {
  try {
    const { text } = req.body;
    const audioBuffer = await textToSpeech(text);
    res.set('Content-Type', 'audio/wav');
    res.send(audioBuffer);
  } catch (err) {
    console.error('TTS error:', err.message);
    res.status(500).json({ error: err.message || 'TTS failed' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
