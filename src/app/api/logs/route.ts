import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, level = 'info', timestamp = new Date().toISOString() } = body
    
    // Log to server console (this will appear in the terminal)
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging message:', error)
    return NextResponse.json({ error: 'Failed to log message' }, { status: 500 })
  }
}
