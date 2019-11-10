# Stream Clarity
Measure video quality (SSIM, PSNR and VMAF) remotely.
Running in production at <a href="https://www.streamclarity.com">StreamClarity.com</a>.

## Is your video clear?


Just like you'd much rather stick your feet in a stream that is clear, or one that is muddy and turbid, a video that is blurry or has artifacts is less likely to be watched than a video that is crisp and clear.

There are 3 common tools used to measure quality of a video:

* SSIM
* PSNR
* VMAF

and they have all been calibrated to the [Mean Opinion Score](https://en.wikipedia.org/wiki/Mean_opinion_score) (MOS).  MOS is measured with human subjects who rate video quality from 1 (low) to 5 (high).  Obviously, using human subjects is an expensive form of testing, so uscalibratinging automated tests to the MOS is a god way to identify video quality.

## What Does Stream Clarity Do?

The 3 tests in Stream Clarity can be run from FFMPEG on the command line.  Adding VMAF requires rebuilding ffmpeg witha  plugin (and I've had issues getting ths to work on a Mac).  In order to simplify video quality testing, Stream Clarity is a Node wrapper around FFMPEG, allowing for remote testing of video quality.

### How do I do it?

All 3 tests compare your original video (the reference), with the modified video.  Simply input the urls for the 2 videos into the form and submit them.  The tests will run (only one test can run at a time).  There will be a link at the bottom of the page to retrive your scores.

Calculating these scores requires frame by frame comparison of the two videos, meaning that for long videos, this can take time (typically 2x the length of the video).  As a best practice, it may be best to submit fragments of the video for analysis in order to receive results in a more timely fashion.

