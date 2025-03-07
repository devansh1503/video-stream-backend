# Video Streaming with RTMP Server

## Overview
This project enables live video streaming using an **RTMP (Real-Time Messaging Protocol) server** built with **Node.js** and **Nginx RTMP module**. The system allows users to broadcast live streams via OBS (Open Broadcaster Software) and view them through a web-based React.js UI.

## Features
- Live streaming via RTMP
- Custom RTMP server with Nginx
- Web UI for managing and watching streams (React.js)
- HLS support for better compatibility
- Docker integration for deployment

## Technologies Used
- **Backend**: Node.js, Express.js
- **Streaming Server**: Nginx with RTMP Module
- **Frontend**: React.js
- **Streaming Tools**: FFmpeg, OBS Studio
- **Database (optional for user management)**: MySQL / PostgreSQL
- **Deployment**: Docker, Nginx

## Architecture
1. **Streamer** (OBS) sends the video stream to the **RTMP Server**.
2. **RTMP Server (Nginx + RTMP Module)** processes the stream.
3. **HLS Conversion** enables playback on the web.
4. **Frontend UI** fetches the HLS stream and displays it.

## Setup Instructions

### 1. Install Nginx with RTMP Module

```sh
sudo apt update
sudo apt install -y nginx libnginx-mod-rtmp
```

### 2. Configure Nginx RTMP Server
Create an Nginx configuration file (`/etc/nginx/nginx.conf`):

```nginx
rtmp {
    server {
        listen 1935;
        chunk_size 4096;

        application live {
            live on;
            record off;
            hls on;
            hls_path /var/www/html/hls;
            hls_fragment 3;
        }
    }
}
```
Restart Nginx:
```sh
sudo systemctl restart nginx
```

### 3. Start Streaming with OBS
- Set **RTMP URL** in OBS: `rtmp://your-server-ip/live/stream_key`
- Start streaming.

### 4. Web Player (React.js Frontend)
Use Video.js to play the stream in your React app:

```jsx
import React from 'react';
import VideoJS from 'video.js';

const VideoPlayer = () => {
    return (
        <video controls>
            <source src="http://your-server-ip/hls/stream_key.m3u8" type="application/x-mpegURL" />
        </video>
    );
};

export default VideoPlayer;
```

## Deployment with Docker
Create a `Dockerfile`:
```dockerfile
FROM nginx
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 1935 8080
CMD ["nginx", "-g", "daemon off;"]
```
Build and run:
```sh
docker build -t rtmp-server .
docker run -p 1935:1935 -p 8080:80 rtmp-server
```

## Future Enhancements
- Implement WebRTC for low-latency streaming
- Add authentication for stream security
- Build a dashboard for managing streams

## Conclusion
This project provides a simple yet powerful video streaming solution using **RTMP** and **HLS**. It can be extended with additional features like user authentication and real-time analytics.

