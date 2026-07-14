import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({ status:'ok', version:'1.0.0', agents:5, swarm:'asyncio', chat:'base44', ts: new Date().toISOString() })
}
