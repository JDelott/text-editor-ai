import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { content, systemPrompt } = await request.json();
    
    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: content
      }],
      system: `You are an AI writing assistant. ${systemPrompt} 
        Please provide specific, constructive feedback and suggestions. 
        Focus on improving the writing while maintaining the author's voice and intent.
        Be clear and concise in your responses.`
    });

    // Get the response text
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : 'Unable to process response';

    return NextResponse.json({ response: responseText });
    
  } catch (error: unknown) {
    console.error('Anthropic API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
