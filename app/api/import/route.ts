import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  // Convert to array of arrays, matching what we saw when we inspected the file
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

  return NextResponse.json({
    sheetName,
    totalRows: rows.length,
    headerRow: rows[0],
    firstDataRow: rows[1],
  })
}