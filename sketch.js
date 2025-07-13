let items = [];
let beakerContents = [];
let popUpMessage = "";
let popUpTimer = 0;
const popUpDuration = 120; // 120 frames = ~2 seconds at 60fps
let liquidImages = {};
let litmus = {
  x: 600,
  y: 200,
  w: 25,
  h: 100,
  dragging: false,
  offsetX: 0,
  offsetY: 0
};

let draggingItem = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

let litmusPH = null;
let isLitmusInLiquid = false;
let liquidTopY = 0;
let liquidBottomY = 0;

const maxLayers = 12; // max layers for pouring
const liquidHeight = 15; // height per layer
const maxLiquidHeight = maxLayers * liquidHeight; // max total liquid height

let pouringSound;
let pourQueue = [];
let currentPour = null;
let pourProgress = 0;
let isPouring = false;

let resetButton;

function preload() {
  pouringSound = loadSound('water-pouring-98795.mp3');
   let imagePaths = {
    "Coffee": "coffee.jpg",
    "Apple Juice": "applejuice.jpg",
    "Lemon Juice": "lemonjuice.jpg",
    "Milk": "milk1.jpg",
    "Mouthwash": "mouthwash.jpg",
    "Pickle": "pickle1.jpg",
    "Soap": "soap.jpg",
    "CocaCola": "soda.jpg",
    "Tomato Juice": "tomatojuice1.jpg",
    "Vinegar": "vinegar.jpg",
     "Water": "water1.jpg"
  };

  for (let key in imagePaths) {
    liquidImages[key] = loadImage(imagePaths[key]);
  }
}

function setup() {
  createCanvas(800, 800); 
  textFont('Times New Roman');

  let leftMargin = 40;
  let topMargin = 160;
  let spacing = 60;

   let liquids = [
  { name: "Coffee", pH: 4.89, color: 'brown', image: "coffee.jpg" },
  { name: "Apple Juice", pH: 3.5, color: 'red', image: "applejuice.jpg" },
  { name: "Lemon Juice", pH: 2.2, color: 'yellow', image: "assets/lemon_juice.png" },
  { name: "Milk", pH: 6.5, color: '#fffdd0', image: "milk1.jpg" },
  { name: "Mouthwash", pH: 9.0, color: '#80dfff', image: "assets/mouthwash.png" },
  { name: "Pickle", pH: 3.0, color: 'darkred', image: "assets/pickle1.png" },
  { name: "Soap", pH: 9.5, color: '#b0e0e6', image: "assets/soap.png" },
  { name: "CocaCola", pH: 2.5, color: 'black', image: "assets/soda.png" },
  { name: "Tomato Juice", pH: 4.2, color: '#ff6347', image: "assets/tomatojuice1.png" },
  { name: "Vinegar", pH: 2.8, color: '#ffb6c1', image: "assets/vinegar.png" },
  { name: "Water", pH: 7, color: 'blue', image: "assets/wate1r.jpg" }
];


liquids.forEach((item, index) => {
  items.push({
    ...item,
    x: leftMargin,
    y: topMargin + index * spacing,
    w: 40,
    h: 40
  });
});
  // Create Reset button below the learn about text
  
  resetButton = createButton("Reset");
  textStyle(BOLD);
  resetButton.position(width / 2 - resetButton.width / 2, 120);
  resetButton.mousePressed(resetSimulation);
}

function resetSimulation() {
  // Reset all variables and states to start fresh
  beakerContents = [];
  pourQueue = [];
  currentPour = null;
  pourProgress = 0;
  isPouring = false;
  litmus.x = 600;
  litmus.y = 200;
  litmus.dragging = false;
  draggingItem = null;
  litmusPH = null;
  isLitmusInLiquid = false;
}

function draw() {
  background(255);
  textAlign(CENTER, TOP);
  textSize(32);
  fill(0);
  textStyle(BOLD);
  text("Stage - 1", width / 2, 20);

  textSize(25);
  fill(0);
  text("Magic Liquids: Acid or Base?", width / 2, 70);

   items.forEach(item => {
  // Show image if available
  if (liquidImages[item.name]) {
    image(liquidImages[item.name], item.x, item.y, item.w, item.h);
  } else {
    // fallback color circle
    fill(item.color);
    noStroke();
    ellipse(item.x + item.w / 2, item.y + item.h / 2, item.w, item.h);
  }

  fill(0);
  textAlign(LEFT, CENTER);
  textSize(14);
  text(item.name, item.x + item.w + 10, item.y + item.h / 2);
});

  let cx = 330;
  let topY = 300;
  let w = 120;
  let h = 200;

  drawBeaker(cx, topY, w, h);

  const ellipseHeight = 30;
  const bottomY = topY + h;

  liquidTopY = bottomY;
  liquidBottomY = bottomY;

  // Draw mixed liquid color inside beaker
  if (beakerContents.length > 0) {
    let mixColor = averageColor(beakerContents.map(i => i.color));
    fill(mixColor);
    noStroke();
    let totalHeight = beakerContents.length * liquidHeight;
    liquidTopY = bottomY - totalHeight - ellipseHeight / 2;
    liquidBottomY = bottomY - ellipseHeight / 2;
    rect(cx - w / 2 + 5, liquidTopY, w - 10, totalHeight);
  }

  drawBeakerMarks(cx, topY, w, h);

  let currentHeight = beakerContents.length * liquidHeight;

  // Start pouring next liquid if not pouring and space available
  if (!isPouring && pourQueue.length > 0 && currentHeight < maxLiquidHeight) {
    currentPour = pourQueue.shift();
    isPouring = true;
    pourProgress = 0;
    if (!pouringSound.isPlaying()) pouringSound.loop();
  }

  if (isPouring && currentPour) {
    if (currentHeight < maxLiquidHeight) {
      drawPouringGlass(currentPour, pourProgress);
      pourProgress += 2;

      let layersFilled = floor(pourProgress / liquidHeight);

      if (layersFilled > beakerContents.length && currentHeight < maxLiquidHeight) {
        beakerContents.push(currentPour);
      }

      if (pourProgress >= maxLiquidHeight) {
        isPouring = false;
        currentPour = null;
        pouringSound.stop();
      }
    } else {
      isPouring = false;
      pourQueue = [];
      pourProgress = 0;
      currentPour = null;
      pouringSound.stop();

      fill('red');
      textSize(24);
      textAlign(CENTER, CENTER);
      text("Beaker is full! Cannot add more liquid.", width / 2, height - 100);
    }
  }

  if (!isPouring && pouringSound.isPlaying()) {
    pouringSound.stop();
  }

  // Litmus logic
  isLitmusInLiquid = false;
  litmusPH = null;

  if (beakerContents.length > 0) {
    let litmusTop = litmus.y;
    let litmusBottom = litmus.y + litmus.h;
    let litmusRight = litmus.x + litmus.w;
    let litmusLeft = litmus.x;

    if (
      litmusBottom > liquidTopY &&
      litmusTop < liquidBottomY &&
      litmusRight > cx - w / 2 &&
      litmusLeft < cx + w / 2
    ) {
      litmusPH = averagePH(beakerContents);
      isLitmusInLiquid = true;
    }
  }

  drawLitmusPaper(litmus.x, litmus.y, litmus.w, litmus.h, litmusPH, isLitmusInLiquid);
  fill(0);
  textSize(12);
  textAlign(CENTER, BOTTOM);
  text("Litmus Paper", litmus.x + litmus.w / 2, litmus.y - 5);

  let meterX = 630;
  let meterY = 540;
  let meterRadius = 120;
  let phForMeter = (isLitmusInLiquid && beakerContents.length > 0) ? averagePH(beakerContents) : null;
 
  // Detect the moment litmus just went into liquid (new event)
if (isLitmusInLiquid && litmusPH !== null && popUpTimer <= 0) {
  if (litmusPH < 7) {
    popUpMessage = "Liquid is acidic";
  } else if (litmusPH > 7) {
    popUpMessage = "Liquid is basic";
  } else if (litmusPH == 7) {
    popUpMessage = "Liquid is neutral";
  }
  popUpTimer = popUpDuration;
}

// Decrease popup timer
// Draw popup text with blue box and yellow text on right side of beaker
// Draw popup text with blue box and yellow text on right side of beaker
if (popUpTimer > 0) {
  popUpTimer--;

  let popupX = 330 + 120 / 2 + 190;
  let popupY = 300 + 100;

  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textSize(24);

  let scaleAmt = map(popUpTimer, 0, popUpDuration, 1, 1.5);

  translate(popupX, popupY);
  scale(scaleAmt);

  noStroke();

  let popupColor = 'white';
  if (litmusPH !== null) {
    if (litmusPH < 7) popupColor = 'red';
    else if (litmusPH > 7) popupColor = 'blue';
    else if (litmusPH == 7) popupColor = "yellow";
  }

  fill(popupColor);
  rect(0, 0, 220, 50, 10);

  fill('white');
  text(popUpMessage, 0, 0);

  pop();
}

}
function drawBeaker(cx, topY, w, h) {
  const bottomY = topY + h;
  const ellipseHeight = 30;
  stroke(0);
  strokeWeight(2);
  fill(240, 240, 255, 80);

  beginShape();
  vertex(cx - w / 2, topY);
  vertex(cx - w / 2, bottomY - ellipseHeight / 2);
  vertex(cx + w / 2, bottomY - ellipseHeight / 2);
  vertex(cx + w / 2, topY);
  endShape(CLOSE);

  fill(255);
  ellipse(cx, topY, w, ellipseHeight);
  fill(240, 240, 255, 80);
  ellipse(cx, topY + 3, w * 0.9, ellipseHeight * 0.6);

  noStroke();
  fill(0);
  textSize(16);
  textAlign(CENTER, TOP);
  text("Glass", cx, bottomY + 10);
}

function drawBeakerMarks(cx, topY, w, h) {
  const bottomY = topY + h;
  const ellipseHeight = 30;
  stroke(0);
  strokeWeight(1);
  let marks = 10;
  for (let i = 1; i < marks; i++) {
    let y = map(i, 0, marks, topY + ellipseHeight / 2, bottomY - ellipseHeight / 2);
    line(cx - w / 2 + 5, y, cx - w / 2 + 20, y);
  }
}

function drawLitmusPaper(x, y, w, h, ph, inLiquid) {
  noStroke();
  fill('yellow');
  rect(x, y, w, h);

  if (inLiquid && ph !== null) {
    let intersectTop = max(y, liquidTopY);
    let intersectBottom = min(y + h, liquidBottomY);
    let intersectHeight = max(0, intersectBottom - intersectTop);

    if (intersectHeight > 0) {
      if (ph < 7) fill('red');
      else if (ph > 7) fill('blue');
      else fill('yellow');
      rect(x, intersectTop, w, intersectHeight);
    }
  }
}

function drawPouringGlass(liquid, progress) {
  let glassX = 330;
  let glassY = 260 - progress;
  push();
  translate(glassX, glassY);
  rotate(radians(-45));
  stroke(100);
  strokeWeight(1.5);
  fill(255, 255, 255, 80);
  beginShape();
  vertex(-15, -30);
  vertex(-20, 30);
  vertex(20, 30);
  vertex(15, -30);
  bezierVertex(10, -35, -10, -35, -15, -30);
  endShape(CLOSE);

  fill(liquid.color);
  noStroke();
  quad(-13, 5, -18, 28, 18, 28, 13, 5);
  pop();

  if (progress > 10) {
    stroke(liquid.color);
    strokeWeight(6);
    line(glassX, glassY + 30, 330, 300);
  }
}

function mousePressed() {
  items.forEach(item => {
    // Only add to pourQueue if there is space in the beaker
    let currentHeight = beakerContents.length * liquidHeight;
    if (dist(mouseX, mouseY, item.x + 20, item.y + 20) < 20 && currentHeight < maxLiquidHeight) {
      pourQueue.push(item);
      draggingItem = item;
      dragOffsetX = mouseX - item.x;
      dragOffsetY = mouseY - item.y;
    }
  });

  if (
    mouseX > litmus.x && mouseX < litmus.x + litmus.w &&
    mouseY > litmus.y && mouseY < litmus.y + litmus.h
  ) {
    litmus.dragging = true;
    litmus.offsetX = mouseX - litmus.x;
    litmus.offsetY = mouseY - litmus.y;
  }
}


function mouseDragged() {
  if (litmus.dragging) {
    litmus.x = mouseX - litmus.offsetX;
    litmus.y = mouseY - litmus.offsetY;
  }
  
}
function mouseReleased() {
  litmus.dragging = false;
  draggingItem = null;
}

function averageColor(colors) {
  let r = 0, g = 0, b = 0;
  colors.forEach(c => {
    let col = color(c);
    r += red(col);
    g += green(col);
    b += blue(col);
  });
  r /= colors.length;
  g /= colors.length;
  b /= colors.length;
  return color(r, g, b);
}

function averagePH(contents) {
  let sum = 0;
  contents.forEach(c => sum += c.pH);
  return sum / contents.length;
}
