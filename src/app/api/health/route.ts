import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({ status:'ok', system:'XTREME-SCRAPER', version:'1.0.0', ts: new Date().toISOString() })
}
