import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Simple file logger
function logToFile(message: string, data: any = null) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}${
      data ? '\n' + JSON.stringify(data, null, 2) : ''
    }\n\n`;

    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    fs.appendFileSync(path.join(logsDir, 'test-webhook.log'), logEntry);
    console.log(`Logged to file: ${message}`);
  } catch (err) {
    console.error('Failed to write log:', err);
  }
}

export async function POST(request: Request) {
  logToFile('Test webhook received');

  let bodyText = 'No body';
  try {
    bodyText = await request.text();
    logToFile('Request body:', bodyText);
  } catch (e) {
    logToFile('Error reading request body', e);
  }

  // Return success response
  return NextResponse.json({
    received: true,
    message: 'Test webhook processed',
  });
}
