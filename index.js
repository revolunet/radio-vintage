const Gpio = require("onoff").Gpio;
const fetch = require("node-fetch");
const ws281x = require("rpi-ws281x");

const { playStream } = require("./mopidy");

function generateSteps(pixels1, pixels2) {
  const animationSteps = [pixels1];
  for (let lol = 0; lol < 11; lol++) {
    const pixels = new Uint32Array([
      ...animationSteps[animationSteps.length - 1],
    ]);
    pixels[10 - lol] = pixels2[10 - lol];
    pixels[10 + lol] = pixels2[10 + lol];
    animationSteps.push(pixels);
  }
  return animationSteps;
}

function easeInOutSine(x) {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

function runLedsAnimation(render, pixels1, pixels2) {
  const steps = generateSteps(pixels1, pixels2);
  const duration = 1000;
  steps.forEach((pixels, i) => {
    const progression = easeInOutSine(i / 11);
    setTimeout(() => {
      render(pixels);
    }, duration * progression);
  });
}

// define a callback for each GPIO.
const buttonsMapping = [
  {
    pin: 17,
    colors: [
      0xff657c,
      0xff657c,
      0xff657c,
      0xff657c,
      0xff657c,
      0xff657c,
      0xff657c,
      0xff657c,
      0xff657c,
      0xff657c,
      0xff657c,
      0xff657c,
      0xff657c,
      0xff657c,
      0xff657c,
      0xff657c,
      0xff657c,
      0xff657c,
      0xff657c,
      0xff657c,
      0xff657c,
    ],
    stream: "http://icecast.radiofrance.fr/fip-midfi.mp3",
  },
  {
    pin: 27,
    colors: [
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
    ],
    stream: "http://icecast.radiofrance.fr/fipjazz-midfi.mp3",
  },
  {
    pin: 22,
    colors: [
      0xde0000,
      0xde0000,
      0xde0000,
      0xde0000,
      0xde0000,
      0xde0000,
      0xde0000,
      0xfffb1d,
      0xfffb1d,
      0xfffb1d,
      0xfffb1d,
      0xfffb1d,
      0xfffb1d,
      0xfffb1d,
      0x008121,
      0x008121,
      0x008121,
      0x008121,
      0x008121,
      0x008121,
      0x008121,
    ],
    stream: "http://icecast.radiofrance.fr/fipreggae-midfi.mp3",
  },
  {
    pin: 6,
    colors: [
      0xde0000,
      0xde0000,
      0xde0000,
      0xde0000,
      0xde0000,
      0xde0000,
      0xde0000,
      0xffffff,
      0xffffff,
      0xffffff,
      0xffffff,
      0xffffff,
      0xffffff,
      0xffffff,
      0x331fff,
      0x331fff,
      0x331fff,
      0x331fff,
      0x331fff,
      0x331fff,
      0x331fff,
    ],
    stream: "http://direct.franceinfo.fr/live/franceinfo-midfi.mp3",
  },
  {
    pin: 9,
    colors: [
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
      0xfaae3c,
    ],
    stream: "http://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3",
  },
  {
    pin: 11,
    colors: [
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
      0x0d11a6,
    ],
    stream: "https://ais-live.cloud-services.paris:8443/europe1.mp3",
  },
  {
    pin: 5,
    callback: () => {},
  },
];

const ledsConfig = { leds: 21, gpio: 12, strip: "grb", brightness: 100 };

let lastPin;
let lastPixels = new Uint32Array(ledsConfig.leds).fill("0xffffff");

ws281x.configure(ledsConfig);

const buttons = buttonsMapping.map((mapping, idx) => {
  const button = new Gpio(mapping.pin, "in", "falling", {
    debounceTimeout: 50,
  });
  button.watch((err, value) => {
    if (err) {
      throw err;
    }
    console.log(`Pushed button ${idx + 1} (pin ${mapping.pin})`);
    if (lastPin === mapping.pin) {
      console.log(`Skip`);
    } else {
      if (mapping.color) {
        const pixels = new Uint32Array(ledsConfig.leds).fill(mapping.color);
        ws281x.render(pixels);
      } else if (mapping.colors) {
        const pixels = new Uint32Array(mapping.colors);
        runLedsAnimation((x) => ws281x.render(x), lastPixels, pixels);
        lastPixels = pixels;
        //ws281x.render(pixels);
      }
      if (mapping.stream) {
        playStream(mapping.stream);
      }
      if (mapping.callback) {
        mapping.callback();
      }
    }
    lastPin = mapping.pin;
  });
  return button;
});

process.on("SIGINT", (_) => {
  buttons.forEach((b) => b.unexport());
});
