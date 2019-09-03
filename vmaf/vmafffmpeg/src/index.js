//https://www.robinwieruch.de/minimal-node-js-babel-setup
//great node tutorial
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import uuidv4 from 'uuid/v4';
const pug = require('pug');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine','pug');


//read files
var fs = require('fs');
var path = "../tests/"

let test= {};
const spawn = require('child_process').spawn;


app.get('/test', (req, res) => {
    //get urls
    //i exect 2 params reference url ref, test url test
    let ref = req.query.refurl;
    let test = req.query.testurl;
    let api =false;
    if (req.query.api == "false" ){
       api = false;
    }else if (req.query.api == "true" ){
     	api = true;
    }
    ref = ref.trim();
    test = test.trim();
    console.log("api: " +api);
    //create unique ID
    const id = uuidv4();
   console.log(test);  
    console.log(ref);
    //kick off ffmpeg test
    var file = "test_" +id+ ".json";
    var videoJsonFile = "json_"+id+".json";
    
  
 

    //get ffprobe format data of both files, and then ru the vmaf compareison 
    var totalJson = "";
    var jsonCombinedPromise = new Promise(function(resolve, reject) {
  	    ffprobe(ref, function(refresult) { 
    		ffprobe(test, function(testresult) {
    			//create combined JSON file
    			var combinedJson = "{\"test\":"+ testresult+",\"reference\":"+refresult+"}"
    			resolve(combinedJson);
    		});
    });    
});
//todo promise rejections need to be added


jsonCombinedPromise.then(function(value) {
  totalJson = value;
  console.log("total json promise:"+ totalJson);
   //compare the 2 videos
   //no longer have to be the same size!!!
   var parsedTotalJson = JSON.parse(totalJson);
   var streamCount = parsedTotalJson[reference][streams].length;
   var refWidth=0;
   var refHeight = 0;
   for(var i=0;i<streamCount;i++){
   		if (parsedTotalJson[reference][streams][i][codec_type] =="video"){
   		   refWidth = parsedTotalJson[reference][streams][i][width];
   			refHeight =parsedTotalJson[reference][streams][i][height];
   		}
   
   } 
   
   console.log('ref video is (hxw):'+refHeight+refWidth);
  let ffmpeg = spawn('ffmpeg', ['-i', test, '-i', ref, '-filter_complex', '[0:v]scale='+'1280'+'x'+'720'+':flags=bicubic[main];[main][1:v]libvmaf=ssim=true:psnr=true:log_fmt=json:log_path='+path+file, `-f`, 'null', '-']);
     
   ffmpeg.stderr.on('data', (err) => {
            console.log('err:', new String(err))
    });
    totalJson = JSON.parse(totalJson);
    
    if (api===true){
         
         console.log('api in true: '+api);
    	const response = {
      		id, totalJson
    	};
   		return res.send(response);
   	} else{
   		 //build a page
   		 console.log('api in false: '+api);
   		 const response = "<html> <body> hello world"+id+ totalJson+"</body</html>";
   		 return res.render('index', {
  			id, totalJson
		 });
   		 
   		 }
  
});
 
  


});

app.get('/testResults', (req, res) => {
  //i expect to get the uuid that corresponds to afilename
  let id = req.query.id;
  //get the data that is stored on the server
  //quality data
  let filename = "test_" +id+ ".json";
  //video data
  let jsonFilename = "json_"+id+",json";
  var result  = fs.readFileSync(path +filename, 'utf8');
  var json = JSON.parse(result);
  
  var jsonData = JSON.parse(fs.readFileSync(path +jsonFilename, 'utf8'));
  
  var returnJson = "{ "+jsonData+"{VMAF:"+json['VMAF score']+", PSNR:"+json['PSNR score']+", SSIM:"+json['SSIM score']+"}}";
  console.log(returnJson);
  const response = {
      returnJson
    };
  return res.send(returnJson);;
});


app.listen(process.env.PORT, () =>
  console.log(`Ready to process video files on port ${process.env.PORT}!`),
);


function ffprobe(videoUrl, callback){
	var dataString = "";
	let probe = spawn('ffprobe', ['-i', videoUrl, '-show_format','-show_streams', `-v`, 'quiet', '-print_format', 'json']);
     console.log("ffprobe" + videoUrl);
     probe.stdout.on('data', (data) => {
        console.log("debugging DL" +data.length);     	
        dataString += data.toString();

 	});
 	probe.on('close', function(code) {
        return callback(dataString);
    });

}
