//https://www.robinwieruch.de/minimal-node-js-babel-setup
//great node tutorial


require('dotenv/config');
const cors = require('cors');
const express =require('express');
const uuidv4 =require('uuid/v4');

//import cors from 'cors';
//import express from 'express';
//import uuidv4 from 'uuid/v4';

const pug = require('pug');
//bull for queuing the vmaf ffmpeg jons
var Queue = require('bull');
var favicon = require('serve-favicon');
const app = express();
app.use(favicon('public/icon.ico')); 
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine','pug');
app.use(express.static('public/'));

var ffprobe = require('ffprobe-client');


app.get('/',  (req, res) => {
     return res.render('landing');
});

app.get('/probe', (req,res) =>{
	let url = req.query.url;
	console.log(" url="+url);
  let ffprobeResult = ffprobe(url) 
  
  ffprobeResult.then(function(info){
    
    //extract some essentials
    //sometimes video is thr first stream.. someties second
    var streamCount = info.format.nb_streams;
   

    //format data is overall
    var bitrate= info.format.bit_rate;
    var sizeBytes = info.format.size;
    var duration = info.format.duration;
    var formatName = info.format.format_name;
    var formatLong = info.format.format_long_name;

    //get video/audio specific infos
    for (var i=0;i<streamCount;i++){
      if (info.streams[i].codec_type == "video"){

        var height = info.streams[i].height;
        var width =info.streams[i].width;
        var aspectRatio = info.streams[i].display_aspect_ratio;
        var videoCodec = info.streams[i].codec_name;
      }else{
        //audio
        var audioCodec = info.streams[i].codec_name;
      }

    }


    console.log(bitrate, sizeBytes, duration, formatLong);
    console.log(height, width, aspectRatio, videoCodec, audioCodec);
    var format = info.format;
    var streams = info.streams;
    console.log(format);
    console.log(streams);

    return res.render('results', {format, streams, bitrate, sizeBytes, duration, formatLong, height, width, aspectRatio, videoCodec,audioCodec});
  }).catch((err) => {
    console.log(err);
  });
});
 
app.listen(3010, () =>
  console.log(`Ready to process video files on port 3010!`),
);

