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

//moesif
var moesif = require('moesif-express');
// 2. Set the options, the only required field is applicationId
var moesifMiddleware = moesif({
  applicationId: 'eyJhcHAiOiI1MTk6MTQ3IiwidmVyIjoiMi4wIiwib3JnIjoiMjQwOjIxMCIsImlhdCI6MTU5Mjg3MDQwMH0.rcYbuEeoN8kSUiopSYFy6ZAhThA0ZGaJLsavzWqaOoQ',
  // Set to false if you don't want to capture req/resp body
  logBody: true,

  // Optional hook to link API calls to users
  identifyUser: function (req, res) {
    return req.user ? req.user.id : undefined;
  },
});

// 3. Enable the Moesif middleware to start capturing incoming API Calls
app.use(moesifMiddleware);


//read files
var fs = require('fs');
//var http = require('http');
//var https = require('https');

var path = "../tests/"
var parsedTotalJson="";
let test= {};
const spawn = require('child_process').spawn;

//create the video queue
//queue allows 2 jobs at a time
const videoQualityQueue = new Queue('ffmpeg-processing-qualityMetrics', {
  limiter: {
    max: 1, 
    duration: 1000
  }
});

const concurrency = 1;
videoQualityQueue.process(concurrency, function(job, done) {
    var jobString = JSON.stringify(job);
    var file = "test_" +job.data.fileID+ ".json";
    console.log(path+file);
	console.log("mobile?" +job.data.mobile);
    var ffmpegPromise = new Promise(function(resolve, reject) {
		var params = ':flags=bicubic[main];[main][1:v]libvmaf=ssim=true:psnr=true:phone_model=true:log_fmt=json:log_path=';
		if(!job.data.mobile){
			params = ':flags=bicubic[main];[main][1:v]libvmaf=ssim=true:psnr=true:log_fmt=json:log_path='
		}
		console.log("mobile: " +job.data.mobile);
		console.log("params: " +params);
         try {
    		let ffmpeg = spawn('ffmpeg', ['-i', job.data.testUrl, '-i', job.data.refUrl, '-filter_complex', '[0:v]scale='+job.data.refVideoWidth+'x'+job.data.refVideoHeight+params+path+file, `-f`, 'null', '-']);
    		console.log("running test id:" +job.data.fileID); 
    		ffmpeg.stderr.on('data', (err) => {
            	console.log('err:', new String(err));
            	
    		});
    		ffmpeg.stdout.on('data', function(){ 
    				console.log('stdout');
    				resolve("success!");
    				
    		 }); 
    	  }
    	  catch (Exception){ 
    			reject("error in promise");
    	  }
    	
    });
    return ffmpegPromise.then(function(successMessage){
    		console.log(successMessage);
    		done();
    		
    });
});

app.get('/',  (req, res) => {
     return res.render('landing');
});

app.get('/probe', (req,res) =>{
	let url = req.query.url;
	console.log("testurl="+url);
	var probeJson = new Promise(function(resolve, reject) {
  	      
  	    try{  
  	      ffprobe(url, function(result) { 
    			//create combined JSON file
    			var resultJson = result;
    			
    			resolve(resultJson);
           });
          } 
          catch(Exception){
          	reject("error in ffprobe promise");
          }
    });
    probeJson.then(function(value) {
//     console.log("total json promise:"+ totalJson);
     //compare the 2 videos
     //no longer have to be the same size!!!
       var parsedprobeJson = JSON.parse(value);
       console.log("parsed json" + value);
       //const response = {parsedprobeJson};
       return res.status(200).send(parsedprobeJson);
   });
       
});
 

app.get('/test', (req, res) => {
    //get urls
    //i exect 2 params reference url ref, test url test
	//i expect 3 parameters reference url ref, test url test, and mobile model
    let ref = req.query.refurl;
    let test = req.query.testurl;
    let api =false;
	let mobile = true;
    
	
    if (req.query.api == "false" ){
       api = false;
    }else if (req.query.api == "true" ){
     	api = true;
    }
 
    if (req.query.mobilemodel == "on" ){
     	mobile = true;
    }else{ mobile=false;}
	
    let testPriority = 5;
    if (req.query.pri !== {}){
      testPriority = req.query.pri;
    }

    //console.log("api: " +api);
    //create unique ID
    const id = uuidv4();
    
    //get ffprobe format data of both files, and then run the vmaf comparison 
    var totalJson = "";
    var jsonCombinedPromise = new Promise(function(resolve, reject) {
  	      
  	    try{  
  	      ffprobe(ref, function(refresult) { 
    		ffprobe(test, function(testresult) {
    			//create combined JSON file
    			var combinedJson = "{\"test\":"+ testresult+",\"reference\":"+refresult+",\"mobile\":"+mobile+"}"
    			resolve(combinedJson);
    		});
           });
          } 
          catch(Exception){
          	reject("error in ffprobe promise");
          }   
});



jsonCombinedPromise.then(function(value) {
  totalJson = value;
//  console.log("total json promise:"+ totalJson);
   //compare the 2 videos
   //no longer have to be the same size!!!
   parsedTotalJson = JSON.parse(totalJson);
   console.log(parsedTotalJson);
   var streamCount = parsedTotalJson['reference']['streams'].length;
   var mobile = parsedTotalJson['mobile'];
   var refWidth=0;
   var refHeight = 0;
   var testWidth=0;
   var testHeight = 0;
   for(var i=0;i<streamCount;i++){
   		if (parsedTotalJson['reference']['streams'][i]['codec_type'] =="video"){
   		   refWidth = parsedTotalJson['reference']['streams'][i]['width'];
   			refHeight =parsedTotalJson['reference']['streams'][i]['height'];
   			console.log("ref: "+refHeight + " x" +refWidth);
   		}
   		if (parsedTotalJson['test']['streams'][i]['codec_type'] =="video"){
   		   testWidth = parsedTotalJson['test']['streams'][i]['width'];
   			testHeight =parsedTotalJson['test']['streams'][i]['height'];
   			console.log("test: "+testHeight + " x" +testWidth);
   		}
   
   } 
   
   //console.log('ref video is (hxw):'+refHeight+refWidth);
   //add video to the queue for quality scoring
  
   const job = videoQualityQueue.add({
     fileID: id,
     testUrl: test, 
     refUrl: ref,
	 mobile: mobile,
     refVideoHeight: refHeight,
     refVideoWidth: refWidth
   },{priority: testPriority});
   
   console.log("fileid:" +id +"mobile"+mobile);
    totalJson = JSON.parse(totalJson);
    var statusCode = 100;
    if (api===true){

    	const response = {
      		id, statusCode, refHeight, refWidth,testWidth, testHeight, totalJson, mobile
    	};
    	//send a 100 meaning that the test is in process
   		return res.status(200).send(response);
   	} else{
   		 //build a page 		 
   		 return res.render('index', {
  			id, statusCode, refHeight, refWidth,testWidth, testHeight, totalJson, mobile
		 });
   		 
   		 }
  
});
 
  


});

app.get('/testResults', (req, res) => {
  //i expect to get the uuid that corresponds to afilename
  let id = req.query.id;
      let api =false;
    if (req.query.api == "false" ){
       api = false;
    }else if (req.query.api == "true" ){
     	api = true;
    }
  let mobile = req.query.mobile;
  console.log("mobile model:" + mobile);
	
  //get the data that is stored on the server
  //quality data
  let filename = "test_" +id+ ".json";
  var result;
  try {
  result = fs.readFileSync(path +filename, 'utf8');
} catch (err) {
     // no file found - not ready yet
     var inProgress = JSON.parse("{\"statusCode\": 101, \"status\": \"Still processing. Try Again in a few minutes.\"}");
     return res.status(200).send(inProgress);
}

  var json = JSON.parse(result);
  var videojson = JSON.stringify(parsedTotalJson);
  console.log(videojson);
  var statusCode = 200;
  var VMAF = json['VMAF score'];
  var PSNR = json['PSNR score'];
  var SSIM = json['SSIM score'];
  var returnJson = "{\"VMAF\":"+json['VMAF score']+", \"PSNR\":"+json['PSNR score']+", \"SSIM\":"+json['SSIM score']+", \"mobile\":"+mobile+"}";
  returnJson = JSON.parse(returnJson);
  //console.log(returnJson);
  var statusCode = 200;
  if(api){
    const response = {
      id, mobile,statusCode,VMAF,PSNR,SSIM
     };
    return res.status(200).send(response);
  }else{
     //build a page 		 
     return res.render('results', {
  			id, mobile,statusCode,VMAF,PSNR,SSIM
	 });
   		 
  }
  
});


app.listen(1437, () =>
  console.log(`Ready to process video files on port 1437!`),
);


function ffprobe(videoUrl, callback){
	var dataString = "";
	let probe = spawn('ffprobe', ['-i', videoUrl, '-show_format','-show_streams', `-v`, 'quiet', '-print_format', 'json']);
    // console.log("ffprobe" + videoUrl);
     probe.stdout.on('data', (data) => {
       // console.log("debugging DL" +data.length);     	
        dataString += data.toString();
		console.log(dataString);
 	});
 	probe.on('close', function(code) {
 		//console.log("close: "+ dataString);
        return callback(dataString);
    });

}
