// POST /api/ai/chat — Scope Agent conversation endpoint.
//
// Streams Claude (Haiku 4.5) over a custom SSE protocol the ScopeAgent widget
// understands:
//   data: {"type":"text","text":"..."}          incremental assistant text
//   data: {"type":"shortlist", ...}             ranked matches + intake fields
//   data: {"type":"done"} | {"type":"error"}
//
// Tool loop runs server-side: when the model calls search_contractors we query
// + rank (trade-scoped), feed the result back, and keep streaming — all within
// one response. Raw fetch to the Anthropic API (repo convention, no SDK dep).

import { NextRequest } from 'next/server'
import {
  buildSystemPrompt,
  findContractors,
  rankContractors,
  toPublicShortlist,
  SEARCH_TOOL,
  MAX_USER_TURNS,
} from '@/lib/scope-agent'

export const maxDuration = 60

const MODEL = 'claude-haiku-4-5'
const MAX_TOOL_ROUNDS = 3

interface ChatMessage {
  role: 'user' | 'assistant'
  content: unknown // string or Anthropic content blocks (tool_use/tool_result round-trips)
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'Scope Agent not configured' }, { status: 503 })
  }

  let body: { messages?: ChatMessage[] }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const incoming = Array.isArray(body.messages) ? body.messages.slice(-40) : []
  // Trust boundary: only accept plain-text turns from the browser.
  const messages: ChatMessage[] = incoming
    .map((m) => ({
      role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: typeof m.content === 'string' ? m.content.slice(0, 2000) : '',
    }))
    .filter((m) => m.content) // empty text blocks 400 on the Anthropic API

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return Response.json({ error: 'messages must end with a user message' }, { status: 422 })
  }

  const userTurns = messages.filter((m) => m.role === 'user').length
  if (userTurns > MAX_USER_TURNS + 2) {
    return Response.json({ error: 'Conversation limit reached' }, { status: 429 })
  }

  let system = buildSystemPrompt()
  if (userTurns >= MAX_USER_TURNS) {
    system += `\n\nIMPORTANT: You have reached the question limit. Do not ask anything else — call search_contractors NOW with your best understanding of the job.`
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))

      try {
        const convo: ChatMessage[] = [...messages]

        for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
          const { content, stopReason } = await streamClaudeTurn(convo, system, send)
          if (stopReason !== 'tool_use') break

          convo.push({ role: 'assistant', content })
          const toolResults: unknown[] = []

          for (const block of content as { type: string; id?: string; name?: string; input?: Record<string, unknown> }[]) {
            if (block.type !== 'tool_use' || block.name !== 'search_contractors') continue
            const input = (block.input ?? {}) as {
              city?: string; state?: string; service_type?: string
              systems?: string[]; building_type?: string; timing?: string; scope_summary?: string
            }
            const rows = await findContractors({ city: input.city, state: input.state })
            const ranked = rankContractors(rows, {
              city: input.city,
              state: input.state,
              systems: input.systems,
              buildingType: input.building_type,
            })
            const shortlist = toPublicShortlist(ranked)

            // Widget renders cards + email gate from this event.
            send({
              type: 'shortlist',
              shortlist,
              intake: {
                city: input.city ?? null,
                state: input.state ?? null,
                service_type: input.service_type ?? null,
                systems: input.systems ?? [],
                building_type: input.building_type ?? null,
                timing: input.timing ?? null,
                scope_summary: input.scope_summary ?? null,
              },
            })

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify({
                match_count: shortlist.length,
                matches: shortlist.map((c) => ({
                  company_name: c.company_name,
                  city: c.city,
                  state: c.state,
                  rating: c.avg_rating,
                  reviews: c.review_count,
                  offers_24_7: c.offers_24_7,
                })),
              }),
            })
          }

          if (!toolResults.length) break
          convo.push({ role: 'user', content: toolResults })
        }

        send({ type: 'done' })
      } catch (err) {
        console.error('Scope agent chat error:', err)
        try {
          send({ type: 'error', message: 'Something went wrong — please try again.' })
        } catch { /* client already gone */ }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}

/**
 * One streamed Anthropic turn. Forwards text deltas to the client via `send`,
 * accumulates full content blocks (incl. tool_use input JSON), and returns them.
 */
async function streamClaudeTurn(
  messages: ChatMessage[],
  system: string,
  send: (obj: Record<string, unknown>) => void
): Promise<{ content: unknown[]; stopReason: string | null }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      stream: true,
      system,
      tools: [SEARCH_TOOL],
      messages,
    }),
  })

  if (!res.ok || !res.body) {
    throw new Error(`Anthropic API ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }

  const content: ({ type: string; text?: string; id?: string; name?: string; input?: unknown } & Record<string, unknown>)[] = []
  let partialJson = ''
  let stopReason: string | null = null

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? '' // keep incomplete trailing line
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      let event: {
        type: string
        index?: number
        content_block?: { type: string; id?: string; name?: string }
        delta?: { type: string; text?: string; partial_json?: string; stop_reason?: string }
      }
      try {
        event = JSON.parse(line.slice(6))
      } catch {
        continue
      }

      switch (event.type) {
        case 'content_block_start':
          content.push({ ...event.content_block!, ...(event.content_block!.type === 'text' ? { text: '' } : {}) })
          partialJson = ''
          break
        case 'content_block_delta': {
          const block = content[content.length - 1]
          if (event.delta?.type === 'text_delta' && event.delta.text) {
            block.text = (block.text ?? '') + event.delta.text
            send({ type: 'text', text: event.delta.text })
          } else if (event.delta?.type === 'input_json_delta') {
            partialJson += event.delta.partial_json ?? ''
          }
          break
        }
        case 'content_block_stop': {
          const block = content[content.length - 1]
          if (block?.type === 'tool_use') {
            try {
              block.input = partialJson ? JSON.parse(partialJson) : {}
            } catch {
              block.input = {}
            }
          }
          break
        }
        case 'message_delta':
          stopReason = event.delta?.stop_reason ?? stopReason
          break
      }
    }
  }

  return { content, stopReason }
}
