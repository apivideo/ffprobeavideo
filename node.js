const spawn = require('child_process').spawn;
 
let refVideo = 'https://res.cloudinary.com/dougsillars/video/upload/eo_30,q_99/v1562844864/rbsp_launch_720p_gz9zfm.mp4';
let distVideo = 'https://res.cloudinary.com/dougsillars/video/upload/eo_30,w_960/w_1280,h_720/v1562844864/rbsp_launch_720p_gz9zfm.mp4';
 
let ffmpeg = spawn('ffmpeg', ['-i', distVideo, '-i', refVideo,'-lavfi', 'libvmaf=\"ssim=1:psnr=1:phone_model=1\"', `-f`, 'null', '-']);
ffmpeg.on('exit', (statusCode) => {
  if (statusCode === 0) {
     console.log('conversion successful')
  }
})

ffmpeg
  .stderr
  .on('data', (err) => {
    console.log('err:', new String(err))
  })