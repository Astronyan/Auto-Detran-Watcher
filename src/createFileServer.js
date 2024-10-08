const { readdir } = require('fs').promises;
const fileSystem = require('fs');
const http = require('http');

http.createServer(async (request, response) => {
    // video reading
    const files = await readdir('./webCam');
    const videoPath = './webCam/' + files.find((file) => file.endsWith('.webm'));
    const stat = fileSystem.statSync(videoPath);

    response.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'video/webm',
        'Content-Length': stat.size
    });

    const readStream = fileSystem.createReadStream(videoPath);
    // We replaced all the event handlers with a simple call to readStream.pipe()
    readStream.pipe(response);
})
    .listen(8000);