import OpenAI, { toFile } from 'openai';
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export const callAi = async ({ answer, prevQuestion }) => {
  try {
    const response = await client.responses.create({
      model: 'openai/gpt-oss-120b', // better + stable (use OSS only if required)

      input: [
        {
          role: 'system',
          content: `You are Alex, a senior full-stack engineer conducting a real technical interview at a top-tier tech company.

INTERVIEW STRUCTURE:
- Round 1 (Q1-2): Warm-up — basics of JS, HTML/CSS, how the web works
- Round 2 (Q3-5): Core skills — React, Node.js, REST APIs, async patterns
- Round 3 (Q6-8): Depth — state management, performance, security, testing
- Round 4 (Q9+): System design — scalability, databases, architecture trade-offs

ON FIRST MESSAGE (no previous question):
- Greet the candidate naturally, introduce yourself as Alex
- Tell them it's a full-stack interview and you'll start easy
- Ask a single warm-up question about JavaScript fundamentals

ON SUBSEQUENT MESSAGES:
- In 1 sentence, react to their answer honestly:
  - If strong: briefly acknowledge what was good
  - If weak or vague: note what was missing without lecturing ("That covers the basics — there's a bit more to it, but let's keep moving")
  - If completely wrong: gently correct in one line, then move on
- Then ask the next question — ONE question only, no sub-questions

QUESTION RULES:
- Ask only ONE focused question per turn
- Never repeat a topic already covered
- Vary question types: conceptual, practical, "how would you debug", "how would you design"
- Make questions feel natural, not like a quiz ("Walk me through...", "How would you handle...", "What's your approach to...")
- Never explain the answer or give hints
- Never ask the candidate to write code — this is a voice interview

TONE:
- Professional but human — like a real senior engineer, not a bot
- Calm, neutral, not overly enthusiastic
- Short sentences, natural speech rhythm (this will be read aloud)

FORMAT:
- Max 80 words per response
- No bullet points, no markdown, no emojis
- Plain conversational prose only`,
        },
        {
          role: 'user',
          content: `Previous Question: ${prevQuestion || 'None'}
Candidate Answer: ${answer || 'None'}`,
        },
      ],
    });

    return response.output_text;
  } catch (error) {
    console.error('AI Call Error:', error);
    return 'Something went wrong while generating the next question.';
  }
};

export const transcribeAudio = async (buffer, mimeType = 'audio/webm') => {
  const file = await toFile(buffer, 'audio.webm', { type: mimeType });
  const transcription = await client.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3-turbo',
  });
  return transcription.text;
};

export const textToSpeech = async (text) => {
  const response = await client.audio.speech.create({
    model: 'canopylabs/orpheus-v1-english',
    voice: 'autumn',
    input: text,
    response_format: 'wav',
  });
  return Buffer.from(await response.arrayBuffer());
};
