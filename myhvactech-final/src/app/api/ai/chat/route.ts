import { NextResponse } from 'next/server'
// TODO: Implement AI chatbot endpoint
// 1. Extract intent from user message (service type, city, urgency)
// 2. Call nearby_contractors() or search_contractors() RPC
// 3. Format results as conversational response with contractor cards
// 4. Stream response using OpenAI/Anthropic streaming API

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
