const Gpio = require("onoff").Gpio;
const fetch = require("node-fetch");
const ws281x = require("rpi-ws281x");

const { playStream } = require("./mopidy");
const buttons = require("./buttons");
const { runLedsAnimation } = require("./leds");

const ledsConfig = { leds: 21, gpio: 12, strip: "grb", brightness: 100 };

let lastPin; // store last pushed button pin (to prevent duplicate plays)
let lastPixels = new Uint32Array(ledsConfig.leds).fill(0xfaae3c); // store last pixels config (so we can transition from them)
const blackPixels = new Uint32Array(ledsConfig.leds).fill(0x000000);

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
    runLedsAnimation((x) => ws281x.render(x), lastPixels, blackPixels, 1500);
  } else if (lastPixels) {
    // restore leds
    runLedsAnimation((x) => ws281x.render(x), blackPixels, lastPixels, 3000);
  }
});

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
        const pixels = new Uint32Array(ledsConfig.leds).fill(mapping.color);
        ws281x.render(pixels);
      } else if (mapping.colors) {
        const pixels = new Uint32Array(mapping.colors);
        runLedsAnimation((x) => ws281x.render(x), lastPixels, pixels);
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
