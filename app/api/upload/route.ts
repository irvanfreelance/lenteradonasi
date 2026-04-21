import { NextResponse } from 'next/server';



export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Blob token missing' }, { status: 500 });
    }

    // Clean up filename
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

    // Upload via direct Vercel Blob REST API
    const response = await fetch(`https://blob.vercel-storage.com/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-version': '7',
      },
      body: file,
      // Pass duplex to allow streaming file natively
      // @ts-ignore
      duplex: 'half'
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Vercel Blob raw error:', err);
      throw new Error('Failed to upload to Vercel Blob');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
