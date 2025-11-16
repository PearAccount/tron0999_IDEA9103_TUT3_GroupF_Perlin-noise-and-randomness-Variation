

// ------------------ P5 SETUP ------------------ //
function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  colorMode(RGB, 255);
  noFill();
  strokeCap(ROUND);

  background(BASE_BG.r, BASE_BG.g, BASE_BG.b);

  // Initialize
  createWheels();

  createFlowParticles();
}

function draw() {

  // Fade previous frame slightly towards background colour (for trailing effect)
  noStroke();
  fill(BASE_BG.r, BASE_BG.g, BASE_BG.b, TRAIL_FADE);
  rect(0, 0, width, height);

  // Draw / animate wheels 
  for (let w of wheels) {
    if (animateWheels) w.update();
    w.display();
  }

  // Draw perlin paths 
  updateFlowField();

  // Draw control panel overlay
  drawControlPanel();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(BASE_BG.r, BASE_BG.g, BASE_BG.b);
  createWheels();
  createFlowParticles();
}



// ------------------ WHEEL LAYOUT ------------------ //

const GRID_TILT = -12;

function pickStyleDotHeavy() {
  return random() < 0.75 ? "dots" : "rays";
}

function createWheels() {
  wheels = [];

  let baseR = min(width, height) / 10;
  let spacingX = baseR * 2;
  let spacingY = baseR * sqrt(3);

  let startX = -baseR;
  let startY = -baseR;
  let endX = width + baseR;
  let endY = height + baseR;

  let cols = ceil((endX - startX) / spacingX) + 1;
  let rows = ceil((endY - startY) / spacingY) + 1;

  for (let j = 0; j < rows; j++) {
    let rowOffset = (j % 2 === 0) ? 0 : spacingX / 2;

    for (let i = 0; i < cols; i++) {
      let x = startX + i * spacingX + rowOffset;
      let y = startY + j * spacingY;

      let r = baseR * random(0.75, 0.9);
      r = min(r, baseR);

      let cx = width / 2;
      let cy = height / 2;

      let dx = x - cx;
      let dy = y - cy;

      let cosA = cos(GRID_TILT);
      let sinA = sin(GRID_TILT);

      let rx = cx + dx * cosA - dy * sinA;
      let ry = cy + dx * sinA + dy * cosA;

      wheels.push(new Wheel(rx, ry, r, pickPalette()));
    }
  }
}

// ------------------ WHEEL CLASS ------------------ //

class Wheel {
  constructor(x, y, r, palette) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.palette = palette;
    this.hasTail = random() < 0.4;

    this.pulsePhase = random(TWO_PI);
    this.pulseSpeed = random(0.1, 1);
    this.pulseAmp = random(0.05, 0.15);

    // Pattern layers
    this.layers = [
      {
        radius: this.r * 0.9,
        dotSize: this.r * random(0.1, 0.14),
        count: 30,
        angle: random(360),
        speed: random(0.4, 0.8),
        style: pickStyleDotHeavy(),
        dotColor: palette.dots1
      },
      {
        radius: this.r * 0.75,
        dotSize: this.r * 0.12,
        count: 20,
        angle: random(360),
        speed: random(-0.6, -0.3),
        style: pickStyleDotHeavy(),
        dotColor: palette.dots2
      },
      {
        radius: this.r * 0.55,
        dotSize: this.r * 0.10,
        count: 18,
        angle: random(360),
        speed: random(0.2, 0.5),
        style: pickStyleDotHeavy(),
        dotColor: palette.dots3
      }
    ];

    this.innerPattern = {
      radius: this.r * 0.35,
      dotSize: this.r * 0.08,
      count: 30,
      angle: random(360),
      speed: random(-0.7, 0.7),
      style: random(["solid", "dots", "rays"])
    };
  }

  update() {
    for (let layer of this.layers) {
      layer.angle += layer.speed;
    }

    if (this.innerPattern.style !== "solid") {
      this.innerPattern.angle += this.innerPattern.speed;
    }

    this.pulsePhase += this.pulseSpeed;
  }

  display() {
    push();
    translate(this.x, this.y);    

    let s = 1 + sin(this.pulsePhase) * this.pulseAmp;
    scale(s);

    // Draw each ring based on current coordinate
    fill(this.palette.outer);
    ellipse(0, 0, this.r * 2);

    fill(this.palette.ring1);
    ellipse(0, 0, this.r * 1.9);

    this.drawPatternLayer(this.layers[0]);

    fill(this.palette.ring2);
    ellipse(0, 0, this.r * 1.55);

    this.drawPatternLayer(this.layers[1]);
    this.drawPatternLayer(this.layers[2]);

    fill(this.palette.ring3);
    ellipse(0, 0, this.r * 0.95);

    // Inner core
    push();
    rotate(this.innerPattern.angle);

    if (this.innerPattern.style === "solid") {
      fill(this.palette.inner);
      ellipse(0, 0, this.r * 0.6);
    } else if (this.innerPattern.style === "dots") {
      fill(this.palette.dots3);
      this.drawDotRing(
        this.innerPattern.radius,
        this.innerPattern.dotSize,
        this.palette.dots3,
        this.innerPattern.count
      );
      fill(this.palette.inner);
      ellipse(0, 0, this.r * 0.5);
    } else if (this.innerPattern.style === "rays") {
      this.drawRays(this.innerPattern.radius, this.palette.rays, this.innerPattern.count);
      fill(this.palette.inner);
      ellipse(0, 0, this.r * 0.5);
    }

    fill(this.palette.center);
    ellipse(0, 0, this.r * 0.32);
    fill(0);
    ellipse(0, 0, this.r * 0.12);

    pop();

    if (this.hasTail) {
      this.drawTail();
    }

    pop();
  }

  drawPatternLayer(layer) {
    push();
    rotate(layer.angle);

    if (layer.style === "dots") {
      this.drawDotRing(layer.radius, layer.dotSize, layer.dotColor, layer.count);
    } else if (layer.style === "rays") {
      this.drawRays(layer.radius, this.palette.rays, layer.count);
    }

    pop();
  }

  // Functions to draw dots / rays
  drawDotRing(radius, dotSize, col, count) {
    fill(col);
    noStroke();
    for (let i = 0; i < count; i++) {
      let a = (360 / count) * i;
      let x = cos(a) * radius;
      let y = sin(a) * radius;
      ellipse(x, y, dotSize, dotSize);
    }
  }

  drawRays(radius, col, count) {
    stroke(col);
    strokeWeight(this.r * 0.05);
    noFill();
    for (let i = 0; i < count; i++) {
      let a = (360 / count) * i;
      let x1 = cos(a) * (radius * 0.4);
      let y1 = sin(a) * (radius * 0.4);
      let x2 = cos(a) * radius;
      let y2 = sin(a) * radius;
      line(x1, y1, x2, y2);
    }
    noStroke();
  }

  drawTail() {
    push();
    stroke(this.palette.tail);
    strokeWeight(this.r * 0.08);
    noFill();

    let start = createVector(0, 0);
    let ctrl = createVector(this.r * 0.7, -this.r * 0.5);
    let end = createVector(this.r * 1.2, -this.r * 0.1);

    beginShape();
    vertex(start.x, start.y);
    quadraticVertex(ctrl.x, ctrl.y, end.x, end.y);
    endShape();

    noStroke();
    pop();
  }
}

// ------------------ COLOUR PALETTES ------------------ //

function pickPalette() {
  let options = [
    {
      outer: "#FFFFFF",
      ring1: "#FF7EB6",
      ring2: "#FF96BF",
      ring3: "#FFB7D4",
      dots1: "#E83432",
      dots2: "#FFFFFF",
      dots3: "#FF7AAE",
      rays: "#FF4C8B",
      inner: "#E92D72",
      center: "#000000",
      tail: "#FF4F9D"
    },
    {
      outer: "#FF9A00",
      ring1: "#FFAF37",
      ring2: "#FFC260",
      ring3: "#FFDD9E",
      dots1: "#E83432",
      dots2: "#FF81B9",
      dots3: "#FF507C",
      rays: "#E83432",
      inner: "#FF4D84",
      center: "#000000",
      tail: "#FF4F9D"
    },
    {
      outer: "#FEC850",
      ring1: "#F7A6D8",
      ring2: "#E86AB8",
      ring3: "#B857B0",
      dots1: "#B52A8B",
      dots2: "#F5B3D9",
      dots3: "#F43EA1",
      rays: "#B52A8B",
      inner: "#FF66C4",
      center: "#000000",
      tail: "#FF3D72"
    },
    {
      outer: "#FFFFFF",
      ring1: "#C77ADD",
      ring2: "#A75BC7",
      ring3: "#7E4AA8",
      dots1: "#E83432",
      dots2: "#FFFFFF",
      dots3: "#D47BE0",
      rays: "#E83432",
      inner: "#6AEB76",
      center: "#000000",
      tail: "#FF4FA7"
    },
    {
      outer: "#FFFFFF",
      ring1: "#91EA7C",
      ring2: "#C2FAB8",
      ring3: "#F47FC2",
      dots1: "#2E9F37",
      dots2: "#C3F9C4",
      dots3: "#F85AA4",
      rays: "#2E9F37",
      inner: "#FF5AAD",
      center: "#000000",
      tail: "#FF4FA0"
    },
    {
      outer: "#FDBA3B",
      ring1: "#FFDD85",
      ring2: "#FFEEC0",
      ring3: "#F79F2D",
      dots1: "#1B3C88",
      dots2: "#FFFFFF",
      dots3: "#C682CA",
      rays: "#1B3C88",
      inner: "#E93D67",
      center: "#000000",
      tail: "#FF4F9C"
    },
    {
      outer: "#FDC54C",
      ring1: "#F275BD",
      ring2: "#C964C5",
      ring3: "#66A4C0",
      dots1: "#C76A00",
      dots2: "#FDC54C",
      dots3: "#EF75D1",
      rays: "#C76A00",
      inner: "#9ECCE0",
      center: "#000000",
      tail: "#FF4F9D"
    },
    {
      outer: "#FFFFFF",
      ring1: "#F38DBF",
      ring2: "#F05C8E",
      ring3: "#D64A72",
      dots1: "#E83432",
      dots2: "#FFFFFF",
      dots3: "#ED5393",
      rays: "#E83432",
      inner: "#6EB66A",
      center: "#000000",
      tail: "#FF4FA0"
    },
    {
      outer: "#234BA0",
      ring1: "#7ACD8A",
      ring2: "#ED5AAA",
      ring3: "#D96A98",
      dots1: "#0D2C75",
      dots2: "#1F46A3",
      dots3: "#B05CCD",
      rays: "#0D2C75",
      inner: "#E63C45",
      center: "#000000",
      tail: "#FF4FA0"
    },
    {
      outer: "#EFB23A",
      ring1: "#F47FBB",
      ring2: "#6B75A0",
      ring3: "#363939",
      dots1: "#26488F",
      dots2: "#FCEDC6",
      dots3: "#ED5B5E",
      rays: "#26488F",
      inner: "#F4343D",
      center: "#000000",
      tail: "#FF4FA7"
    }
  ];

  return random(options);
}

// ==== PARTICLE CONTROL ====

// How many particles
let PARTICLE_COUNT = 1000;

// Speed multiplier for all particles
let PARTICLE_SPEED = 4.0;   

// Perlin field scale 
let FLOW_SCALE = 0.0016;    

// Particle line thickness
let PARTICLE_THICKNESS = 5;

// Fade speed of the background trails
let TRAIL_FADE = 18;        // lower = longer trails, higher = shorter trails

// Effect radius multiplier of the wheels
let RADIUS_FACTOR = 2.0;

let wheels = [];
let animateWheels = true;



// ==== FLOW FIELD / PERLIN PATHS ====
let flowParticles = [];
const NUM_FLOW_PARTICLES = PARTICLE_COUNT;
let noiseScale = FLOW_SCALE;
let noiseZ = 0;

const BASE_BG = { r: 4, g: 87, b: 131 };



// ==== FLOW PARTICLES ====

function createFlowParticles() {
  flowParticles = [];
  for (let i = 0; i < NUM_FLOW_PARTICLES; i++) {
    flowParticles.push(new FlowParticle());
  }
}

// Function to avoid spawning particles too close to a wheel
function isNearAnyWheel(pos) {
  for (let w of wheels) {
    let d = dist(pos.x, pos.y, w.x, w.y);
    let influenceRadius = w.r * 1.4;  
    if (d < influenceRadius) {
      return true;  // too close to this wheel
    }
  }
  return false;
}



class FlowParticle {

  constructor() {
    this.reset();
  }
  
  reset() {
    const margin = 10;
    let tries = 0;

    while (true) {
      // Spawn from top-right band
      let candidate = createVector(
        width - random(margin, width * 0.3),
        random(-margin, height * 0.7)
      );

      if (!isNearAnyWheel(candidate) || tries > 20) {
        this.pos = candidate;
        break;
      }

      tries++;
    }

    this.prev = this.pos.copy();
    this.speed = random(0.7, 1.5)* PARTICLE_SPEED;
    this.vel = createVector(-1, 0).mult(this.speed);
  }


  update() {
    this.prev.set(this.pos);

    // Base moving direction from Perlin noise
    let n = noise(this.pos.x * noiseScale, this.pos.y * noiseScale, noiseZ);
    let baseAngle = n * TWO_PI * 4.0;
    let vel = p5.Vector.fromAngle(baseAngle).mult(this.speed);

    // Find nearest wheel 
    let nearest = null;
    let nearestDist2 = Infinity;

    for (let w of wheels) {
      let maxR = w.r * 1.6; // influence radius
      if (
        this.pos.x < w.x - maxR || this.pos.x > w.x + maxR ||
        this.pos.y < w.y - maxR || this.pos.y > w.y + maxR
      ) {
        continue;
      }

      let dx = this.pos.x - w.x;
      let dy = this.pos.y - w.y;
      let d2 = dx * dx + dy * dy;
      if (d2 < nearestDist2) {  // Update the nearest wheels
        nearestDist2 = d2;
        nearest = w;
      }
    }

    // Steer around wheels
    if (nearest) {
      let d = sqrt(nearestDist2);
      let outerInfluence = nearest.r * 1.0 * RADIUS_FACTOR;
      let innerRadius = nearest.r * 0.95 ;

      if (d < outerInfluence) {
        let radial = createVector(this.pos.x - nearest.x, this.pos.y - nearest.y);
        radial.normalize();

        // tangent direction around the wheel
        let tangent = createVector(-radial.y, radial.x).normalize();

        // choose the tangent closer to current Perlin direction
        if (p5.Vector.dot(tangent, vel) < 0) {
          tangent.mult(-1);
        }

        let t = constrain(
          (outerInfluence - d) / (outerInfluence - innerRadius),
          0,
          1
        );

        let steerDir = p5.Vector.lerp(vel.copy().normalize(), tangent, 0.7 + 0.3 * t); // At least 70% tendency to tangent vector
        vel = steerDir.mult(this.speed);

        // push out the particle if it get too close to the wheel center
        if (d < innerRadius) {
          let push = radial.copy().mult(innerRadius - d + 0.5);
          this.pos.add(push);
        }
      }
    }

    // Eliminate back tracking phenomenon
    if (this.vel && p5.Vector.dot(vel, this.vel) < 0) {
      vel.mult(-1);
    }

    // Move
    this.pos.add(vel);
    this.vel = vel.copy();

    
    // When the particle finally exits any border, reset it to the top-right.
    if (
      this.pos.x < -20 || this.pos.x > width + 20 ||
      this.pos.y < -20 || this.pos.y > height + 20
    ) {
      this.reset();
      return; 
    }

    // Borrow color c from nearest wheel palette
    let c;
    if (nearest) {
      const pal = nearest.palette;
      const choices = [pal.dots1, pal.dots2, pal.dots3, pal.tail, pal.ring1, pal.ring2];
      const idx = floor(n * choices.length) % choices.length;   // Randomly pick a color from the wheel's palette
      c = color(choices[idx]);
      c.setAlpha(map(this.speed, 0.7, 1.5, 90, 190));
    } else {
      // fallback if somehow no wheel nearby
      if (n < 0.33)      c = color(12, 122, 142, 110);
      else if (n < 0.66) c = color(243, 117, 180, 160);
      else               c = color(253, 186, 59, 170);
    }

    strokeWeight(PARTICLE_THICKNESS);
    stroke(c);
    line(this.prev.x, this.prev.y, this.pos.x, this.pos.y);
  }
}




function updateFlowField() {
  noiseZ += 0.003;    // Keep updating the noise field to avoid having static path
  for (let p of flowParticles) {
    p.update();
  }
}


// ==== INPUT ==== 
function drawControlPanel() {
  push();

  let panelWidth = 230;
  let panelHeight = 80;
  let margin = 12;

  let x = margin;
  let y = height - panelHeight - margin;

  // Panel background
  noStroke();
  fill(0, 160);
  rect(x, y, panelWidth, panelHeight, 10);

  // Text
  fill(255);
  textAlign(LEFT, TOP);
  textSize(11);

  let lineY = y + 8;
  let lineX = x + 10;

  text("Controls:", lineX, lineY);
  lineY += 16;
  text("↑ / ↓  – Speed  + / -", lineX, lineY);
  lineY += 14;
  text("← / →  – Thickness  - / +", lineX, lineY);
  lineY += 18;

  
  text(
    "Speed: " + PARTICLE_SPEED.toFixed(2) +
    "   Thick: " + PARTICLE_THICKNESS.toFixed(1),
    lineX,
    lineY
  );

  pop();
}

function keyPressed() {

  //  particle speed (UP = faster, DOWN = slower)
  if (keyCode === UP_ARROW) {
    let prev = PARTICLE_SPEED;
    PARTICLE_SPEED *= 1.20;      // increase speed
    let factor = PARTICLE_SPEED / prev;

    // apply instantly to all active particles
    for (let p of flowParticles) {
      p.speed *= factor;
    }
    console.log("Speed:", PARTICLE_SPEED.toFixed(2));
  }

  if (keyCode === DOWN_ARROW) {
    let prev = PARTICLE_SPEED;
    PARTICLE_SPEED *= 0.80;      // decrease speed
    let factor = PARTICLE_SPEED / prev;

    for (let p of flowParticles) {
      p.speed *= factor;
    }
    console.log("Speed:", PARTICLE_SPEED.toFixed(2));
  }

  // thickness (LEFT = thinner, RIGHT = thicker)
  if (keyCode === LEFT_ARROW) {
    PARTICLE_THICKNESS = max(0.5, PARTICLE_THICKNESS - 0.5);
    console.log("Thickness:", PARTICLE_THICKNESS.toFixed(2));
  }

  if (keyCode === RIGHT_ARROW) {
    PARTICLE_THICKNESS += 0.5;
    console.log("Thickness:", PARTICLE_THICKNESS.toFixed(2));
  }
}

