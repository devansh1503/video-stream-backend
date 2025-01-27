const express = require('express');
const http = require('http');
const socket= require('socket.io');
const path = require('path');
const cors = require('cors')
const childProcess = require('child_process');
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const { connectDB } = require('./middleware/database');

const app = express();
app.use(cors());
// app.use(express.urlencoded());
app.use(bodyParser.json())
const SocketIO = socket.Server
const spawn = childProcess.spawn

let ffmpegProcess = null

const server = http.createServer(app);

const io = new SocketIO(server, {
    cors: {
        origin: "*",
        methods: ['GET', 'POST']
    }
})
io.on('connection', socket => {
    console.log(socket.id)

    socket.on('start-stream', ({rtmp_url, key}) => {
        if(!rtmp_url || !key){
            socket.emit('error', {message: 'RTMP URL or Key is missing'});
            return;
        }
        const options = [
            '-i',
            '-',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-tune', 'zerolatency',
            '-r', `${25}`,
            '-g', `${25 * 2}`,
            '-keyint_min', 25,
            '-crf', '25',
            '-pix_fmt', 'yuv420p',
            '-sc_threshold', '0',
            '-profile:v', 'main',
            '-level', '3.1',
            '-c:a', 'aac',
            '-b:a', '320k',
            '-ar', 128000 / 4,
            '-f', 'flv',
            `${rtmp_url}/${key}`, //RTMP Server link  
        
        ];
        
        ffmpegProcess = spawn('ffmpeg', options);

        ffmpegProcess.stderr.on('data', (data) => {
            console.log(`FFmpeg Log: ${data.toString()}`);
        });
    
        ffmpegProcess.on('error', (error) => {
            console.log(`FFmpeg Error: ${error.message}`);
            socket.emit('error', { message: 'FFmpeg encountered an error.' });
        });
    
        ffmpegProcess.on('close', (code) => {
            console.log(`FFmpeg process closed with code ${code}`);
            socket.emit('stream-ended', { message: 'Stream ended.' });
        });
        
    })
    socket.on('binarystream', (stream) => {
        if (ffmpegProcess) {
            ffmpegProcess.stdin.write(stream, (error) => {
            if (error) {
                // console.log("Error writing to FFmpeg stdin:", error);
            }
            });
        } else {
            console.log("FFmpeg process not started. Cannot process stream.");
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        if (ffmpegProcess) {
          ffmpegProcess.stdin.end(); // End the stdin stream to stop FFmpeg
          ffmpegProcess.kill(); // Terminate the FFmpeg process
          ffmpegProcess = null;
        }
    });
})

app.post('/register', async (req, res) => {
    const { username, password, streamKey } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const existingStreamKey = await User.findOne({ streamKey });
        if (existingStreamKey) {
            return res.status(400).json({ message: 'Stream key already in use' });
        }

        const user = new User({
            username,
            password,
            streamKey,
        });

        await user.save();

        res.status(201).json({
            message: 'User Registered',
            streamKey,
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/login', async (req, res)=>{
    try{
        const {username, password} = req.body;
        const user = await User.findOne({username})
        if(await bcrypt.compare(password, user.password)){
            res.json({success:true, streamKey:user.streamKey})
            return;
        }
        res.status(400).json({success:false})
    }
    catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

app.post("/auth", async(req, res)=>{
    const {streamKey} = req.body
    const user = await User.findOne({streamKey})
    if(user){
        return res.json({ success: true })
    }
    res.status(401).json({success:false, message:'Invalid Stream Key'})
})

connectDB()

server.listen(4000, ()=>console.log("Running on http://localhost:4000/"))