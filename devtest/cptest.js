const fs = require("fs");
const child_process = require("child_process");
// const toStream = require('buffer-to-stream')

const data = fs.readFileSync("./test.wav");

const ffmpegProcess = child_process.spawn("ffmpeg", "-i - -f mp3 -".split(" "));
ffmpegProcess.stdin.on("end", e => console.log("stdin end"));
ffmpegProcess.stdin.on("error", e => console.log("stdin error", e));
ffmpegProcess.stdout.on("close", e => console.log("stdout close"));
ffmpegProcess.stdout.on("end", e => console.log("stdout end"));
ffmpegProcess.stdout.on("error", e => console.log("stdout error", e));


// toStream(data, 10240).pipe(ffmpegProcess.stdin);
ffmpegProcess.stdout.pipe(fs.createWriteStream("test.mp3"));

ffmpegProcess.stdin.end(data);


/*
cat test.wav | ffmpeg -i -  -f mp3 - > test.mp3


*/