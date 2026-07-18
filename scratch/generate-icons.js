const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3003;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Read the SVG content
const svgContent = fs.readFileSync(path.join(PUBLIC_DIR, 'icon.svg'), 'utf8');

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>PWA Icon Generator</title>
</head>
<body style="font-family: sans-serif; padding: 20px; background: #f1f5f9;">
  <h1>Generating PWA Icons...</h1>
  <div id="status">Converting SVG to PNG sizes...</div>
  
  <div style="display: flex; gap: 20px; margin-top: 20px;">
    <div>
      <h3>192x192</h3>
      <canvas id="canvas192" width="192" height="192" style="border: 1px solid #ccc; background: white;"></canvas>
    </div>
    <div>
      <h3>512x512</h3>
      <canvas id="canvas512" width="512" height="512" style="border: 1px solid #ccc; background: white;"></canvas>
    </div>
    <div>
      <h3>Maskable 192x192</h3>
      <canvas id="canvasMask192" width="192" height="192" style="border: 1px solid #ccc; background: white;"></canvas>
    </div>
    <div>
      <h3>Maskable 512x512</h3>
      <canvas id="canvasMask512" width="512" height="512" style="border: 1px solid #ccc; background: white;"></canvas>
    </div>
  </div>

  <script>
    const svgString = ${JSON.stringify(svgContent)};
    
    // Function to render SVG to canvas
    function renderSVG(canvasId, width, height, isMaskable) {
      return new Promise((resolve) => {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
          ctx.clearRect(0, 0, width, height);
          
          if (isMaskable) {
            // Maskable icons need a safe zone padding (10% padding on all sides)
            // Draw gradient background
            const grad = ctx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, '#f97316');
            grad.addColorStop(1, '#f95713');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
            
            // Draw the inner logo shape (80% size centered)
            const paddingX = width * 0.1;
            const paddingY = height * 0.1;
            ctx.drawImage(img, paddingX, paddingY, width * 0.8, height * 0.8);
          } else {
            // Standard icon (full bleed SVG)
            ctx.drawImage(img, 0, 0, width, height);
          }
          
          URL.revokeObjectURL(url);
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        };
        img.src = url;
      });
    }

    async function run() {
      try {
        document.getElementById('status').innerText = 'Rendering canvases...';
        const png192 = await renderSVG('canvas192', 192, 192, false);
        const png512 = await renderSVG('canvas512', 512, 512, false);
        const pngMask192 = await renderSVG('canvasMask192', 192, 192, true);
        const pngMask512 = await renderSVG('canvasMask512', 512, 512, true);
        
        document.getElementById('status').innerText = 'Sending to server...';
        
        const sendFile = async (filename, dataUrl) => {
          const res = await fetch('/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, dataUrl })
          });
          return res.json();
        };

        await sendFile('icon-192.png', png192);
        await sendFile('icon-512.png', png512);
        await sendFile('icon-maskable-192.png', pngMask192);
        await sendFile('icon-maskable-512.png', pngMask512);

        document.getElementById('status').innerText = 'All icons saved successfully! Shutting down...';
        
        // Notify server to shutdown
        fetch('/done');
      } catch (err) {
        document.getElementById('status').innerText = 'Error: ' + err.message;
        console.error(err);
      }
    }

    // Wait a bit to ensure fonts/load complete
    setTimeout(run, 500);
  </script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlContent);
  } else if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { filename, dataUrl } = payload;
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        const filePath = path.join(PUBLIC_DIR, filename);
        
        fs.writeFileSync(filePath, base64Data, 'base64');
        console.log(`Saved: ${filename}`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else if (req.url === '/done') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('done');
    console.log('Icons generated. Closing server...');
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Icon generator server running at http://localhost:${PORT}`);
});
