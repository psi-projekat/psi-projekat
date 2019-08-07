'use strict';

// Constants
const LOADING_DISPLAY = 1;
const LOADING_TRESHOLD = LOADING_DISPLAY ? 1e-4 : 1;

/*
  This should be the first action. Let the CSS
  load in the background while we display
  the loading screen.
*/
let hasCss = 0;
let hasModules = 0;
injectCss();

/*
  The number of all XHR requests that are intended
  to be performed directly or indirectly.
*/
const MODULES_NUM = 140;
O.module.remaining = MODULES_NUM;

// Main and loading divs
const loadingDiv = O.ce(O.body, 'div', 'top loading');
const mainDiv = O.ce(O.body, 'div', 'top main');
const modalDiv = O.ce(O.body, 'div', 'top modal-outer');
injectLoading();

// Initialize the local storage and the session storage wrappers
const storage = require('./storage');
O.lst = new storage.LocalStorage();
O.sst = new storage.SessionStorage();

// Load modules
const backend = require('./backend');
const DOM = require('./dom');

let dom = null;

hasModules = 1;

// This is the main function
async function main(){
  // Ensure that CSS and all modules are loaded
  await O.while(() => !(hasCss && hasModules));

  // Create DOM instance
  dom = new DOM(mainDiv, modalDiv);

  dom.once('load', () => {
    loadingDiv.classList.add('fade-in-out');
    mainDiv.classList.add('fade-in-out');
    modalDiv.classList.add('fade-in-out');

    // Remove loading screen
    loadingDiv.style.opacity = '0';
    loadingDiv.style.pointerEvents = 'none';
    mainDiv.style.opacity = '1';
    mainDiv.style.pointerEvents = 'all';
  }).once('error', err => {
    error(err);
  });
}

function injectCss(){
  O.rfLocal('style.css', (status, data) => {
    if(status !== 200) return error('Cannot load CSS');
    const style = O.doc.createElement('style');
    style.innerHTML = data;
    O.head.appendChild(style);
    hasCss = 1;
  });
}

function injectLoading(){
  const w = window.innerWidth;
  const h = window.innerHeight;
  const [wh, hh] = [w, h].map(a => a / 2);

  const canvas = O.ce(loadingDiv, 'canvas');
  canvas.width = w;
  canvas.height = h;

  const g = canvas.getContext('2d');
  g.translate(wh, hh);
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  g.fillStyle = '#444';
  g.lineWidth = 20;

  let k = 0;

  render();

  function render(){
    g.save();
    g.resetTransform();
    g.clearRect(0, 0, w, h);
    g.restore();

    const f = .9;
    const f1 = 1 - f;

    const kk = 1 - O.module.remaining / MODULES_NUM;

    k = k * f + kk * f1;
    const percent = k * 100 + .5 | 0;

    if(LOADING_DISPLAY){
      g.font = '100px arial';
      g.fillText(`${percent}%`, 0, 0);

      g.strokeStyle = '#ccc';
      g.beginPath();
      g.arc(0, 0, 200, 0, O.pi2);
      g.stroke();

      g.strokeStyle = '#444';
      g.beginPath();
      g.arc(0, 0, 200, -O.pih, k * O.pi2 - O.pih);
      g.stroke();
    }

    if(O.module.remaining === 0 && 1 - k < LOADING_TRESHOLD)
      return main().catch(error);

    O.raf(render);
  }
}

function error(err){
  try{
    O.glob.dom.err(err);
  }catch{
    O.error(err);
  }
}