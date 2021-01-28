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
    
    //console.log(info);
    var format = info.format;
    var streams = info.streams;
    console.log(format);
    console.log(streams);

    return res.render('results', {format, streams});
  }).catch((err) => {
    console.log(err);
  });
});
 
app.listen(3010, () =>
  console.log(`Ready to process video files on port 3010!`),
);

