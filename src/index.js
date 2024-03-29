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
  let json = req.query.json;
	console.log(" url="+url);
  let ffprobeResult = ffprobe(url) 
  
  ffprobeResult.then(function(info){
    
    //extract some essentials
    //sometimes video is thr first stream.. someties second
    var streamCount = info.format.nb_streams;
   
    //initialise variables here, and guive them an empty value
    var bitrate = "not provided";
    var sizeBytes = "not provided";
    var duration = "not provided";
    var formatName = "not provided";
    var formatLong = "not provided";
    var height = "not provided";
    var width = "not provided";
    var aspectRatio = "not provided";
    var videoCodec = "not provided";
    var audioCodec = "not provided";


    //format data is overall
     
    if(info.format.bit_rate){
      bitrate= info.format.bit_rate;
    }
    if(info.format.size){
     sizeBytes = info.format.size;
    }
    if(info.format.duration){
     duration = info.format.duration;
    }
    if(info.format.format_name){
       formatName = info.format.format_name;
    }
    if(info.format.format_long_name){
       formatLong = info.format.format_long_name;
    }
    //get video/audio specific infos
    for (var i=0;i<streamCount;i++){
      if (info.streams[i].codec_type == "video"){
        if(info.streams[i].height){
          height = info.streams[i].height;
        }
        if(info.streams[i].width){
          width =info.streams[i].width;
        }
         if (info.streams[i].display_aspect_ratio){
          aspectRatio = info.streams[i].display_aspect_ratio;
         }
          if (info.streams[i].codec_name){
            videoCodec = info.streams[i].codec_name;
          }
      }else{
        //audio
        if (info.streams[i].codec_name){
         audioCodec = info.streams[i].codec_name;
        }
      }

    }


    console.log(bitrate, sizeBytes, duration, formatLong);
    console.log(height, width, aspectRatio, videoCodec, audioCodec);
    var format = info.format;
    var streams = info.streams;
    console.log(format);
    console.log(streams);

   

    if(json ==1){
      res.json({"width": width,
               "height": height,
               "aspectRatio": aspectRatio,
               "videoCodec": videoCodec,
               "sizeBytes": sizeBytes,
               "duration": duration,
               "formatLong": formatLong,
               "audioCodec": audioCodec,
               "bitrate": bitrate
               
               });
    }else{
      return res.render('results', {format, streams, bitrate, sizeBytes, duration, formatLong, height, width, aspectRatio, videoCodec,audioCodec});
    }
    }).catch((err) => {
    console.log(err);
  });
});
 
app.listen(process.env.PORT ||  3010, () =>
  console.log(`Ready to process video files on port 3010!`),
);

