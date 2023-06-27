const video3 = document.getElementsByClassName('input_video3')[0];
const out3 = document.getElementsByClassName('output3')[0];
const controlsElement3 = document.getElementsByClassName('control3')[0];
const canvasCtx3 = out3.getContext('2d');
const fpsControl = new FPS();
const canv1 = document.getElementsByClassName('canvas1')[0];
const ctx1 = canv1.getContext('2d');

const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
  spinner.style.display = 'none';
};

function onResultsHands(results) {
  document.body.classList.add('loaded');
  fpsControl.tick();

  canvasCtx3.save();
  canvasCtx3.clearRect(0, 0, out3.width, out3.height);
  canvasCtx3.drawImage(
      results.image, 0, 0, out3.width, out3.height);
  if (results.multiHandLandmarks && results.multiHandedness) {
    if(results.multiHandLandmarks[0] && results.multiHandLandmarks[1] ){

      let lm04 = results.multiHandLandmarks[0][4];
      let lm08 = results.multiHandLandmarks[0][8];
      let lm14 = results.multiHandLandmarks[1][4];
      let lm18 = results.multiHandLandmarks[1][8];
      if( Math.pow(lm04.x - lm18.x, 2) + Math.pow(lm04.y - lm18.y, 2) <= 0.01 && 
        Math.pow(lm14.x - lm08.x, 2) + Math.pow(lm14.y - lm08.y, 2) <= 0.01) {
          const [x4,y4,x8,y8] = [out3.width*lm04.x, out3.height*lm04.y,out3.width*lm08.x, out3.height*lm08.y];
          const [x14,y14,x18,y18] = [out3.width*lm14.x, out3.height*lm14.y,out3.width*lm18.x, out3.height*lm18.y];
            console.log("トリミング中…");
            canvasCtx3.strokeRect(x4, y8, x8 - x4, y4 - y8);
            canvasCtx3.strokeStyle = "rgba(" + [0, 0, 255, 0.5] + ")";
            ctx1.drawImage(
              out3,
              x4, y8,
              x8 - x4, y4 - y8,
              0,0,
              480, 480
            );
          }
    }
    for (let index = 0; index < results.multiHandLandmarks.length; index++) {
      const classification = results.multiHandedness[index];
      const isRightHand = classification.label === 'Right';
      const landmarks = results.multiHandLandmarks[index];
      drawConnectors(
          canvasCtx3, landmarks, HAND_CONNECTIONS,
          {color: isRightHand ? '#00FF00' : '#FF0000'}),
      drawLandmarks(canvasCtx3, landmarks, {
        color: isRightHand ? '#00FF00' : '#FF0000',
        fillColor: isRightHand ? '#FF0000' : '#00FF00',
        radius: (x) => {
          return lerp(x.from.z, -0.15, .1, 10, 1);
        }
      });
    }
     
  }
  canvasCtx3.restore();
}

const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.1/${file}`;
}});
hands.onResults(onResultsHands);

const camera = new Camera(video3, {
  onFrame: async () => {
    await hands.send({image: video3});
  },
  width: 480,
  height: 480
});
camera.start();

new ControlPanel(controlsElement3, {
      selfieMode: true,
      maxNumHands: 2,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })
    .add([
      new StaticText({title: 'MediaPipe Hands'}),
      fpsControl,
      new Toggle({title: 'Selfie Mode', field: 'selfieMode'}),
      new Slider(
          {title: 'Max Number of Hands', field: 'maxNumHands', range: [1, 4], step: 1}),
      new Slider({
        title: 'Min Detection Confidence',
        field: 'minDetectionConfidence',
        range: [0, 1],
        step: 0.01
      }),
      new Slider({
        title: 'Min Tracking Confidence',
        field: 'minTrackingConfidence',
        range: [0, 1],
        step: 0.01
      }),
    ])
    .on(options => {
      video3.classList.toggle('selfie', options.selfieMode);
      hands.setOptions(options);
    });