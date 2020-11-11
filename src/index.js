const Gpio = require("onoff").Gpio;
const fetch = require("node-fetch");
const ws281x = require("rpi-ws281x");
const color = require("color");

const { playStream } = require("./mopidy");
const buttons = require("./buttons");
const { runLedsAnimation } = require("./leds");

const ledsConfig = { leds: 22, gpio: 12, strip: "grb", brightness: 255 };

let lastPin; // store last pushed button pin (to prevent duplicate plays)
let lastPixels = new Uint32Array(ledsConfig.leds - 1).fill(0xfaae3c); // store last pixels config (so we can transition from them)
const blackPixels = new Uint32Array(ledsConfig.leds - 1).fill(0x000000);

ws281x.configure(ledsConfig);

const powerButton = new Gpio(26, "in", "both", {
  debounceTimeout: 50,
});

powerButton.watch((err, value) => {
  if (err) {
    throw err;
  }
  if (value) {
    // close leds
    runLedsAnimation(
      (x) => renderLeds(x, 0x000000),
      lastPixels,
      blackPixels,
      1500
    );
  } else if (lastPixels) {
    // restore leds
    runLedsAnimation((x) => renderLeds(x), blackPixels, lastPixels, 1500);
  }
});

const renderLeds = (pixels, lastPixel = 0xff8b28) => {
  const pixels2 = new Uint32Array([
    ...pixels.map((p, i) =>
      color(p)
        .darken(Math.min(0.9, 0.7 + Math.abs(i - 10) * 0.02))
        .rgbNumber()
    ),
    lastPixel,
  ]);
  ws281x.render(pixels2);
};

const radioButtons = buttons.map((mapping, idx) => {
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
        const pixels = new Uint32Array(ledsConfig.leds - 1).fill(mapping.color);
        renderLeds(pixels);
      } else if (mapping.colors) {
        const pixels = new Uint32Array(mapping.colors);
        runLedsAnimation((x) => renderLeds(x), lastPixels, pixels);
        lastPixels = pixels;
      }
      if (mapping.stream) {
        playStream(mapping.stream);
      }
    }
    lastPin = mapping.pin;
  });
  return button;
});

process.on("SIGINT", (_) => {
  radioButtons.forEach((b) => b.unexport());
});
