export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Simple status check endpoint
  res.json({ 
    status: 'ok', 
    ffmpeg: 'available',
    timestamp: new Date().toISOString()
  });
}