const Gpio = require("onoff").Gpio;
const fetch = require("node-fetch");
const { playStream } = require("./mopidy");

// define a callback for each GPIO.
const pins = {
  17: () => {
    playStream("http://icecast.radiofrance.fr/fip-midfi.mp3");
  },
  27: () => {
    playStream("http://icecast.radiofrance.fr/fipjazz-midfi.mp3");
  },
  22: () => {
    playStream("http://icecast.radiofrance.fr/fipreggae-midfi.mp3");
  },
  10: () => {
    playStream("http://direct.franceinfo.fr/live/franceinfo-midfi.mp3");
  },
  9: () => {},
  11: () => {},
  5: () => {}
};

let lastPin;

const buttons = Object.keys(pins).map((pin, idx) => {
  const button = new Gpio(pin, "in", "falling", { debounceTimeout: 50 });
  button.watch((err, value) => {
    if (err) {
      throw err;
    }
    console.log(`Pushed button ${idx + 1} (pin ${pin})`);
    if (lastPin===pin) {
      console.log(`Skip`);
    } else {
      pins[pin]();
    }
    lastPin = pin
  });
  return button;
});

process.on("SIGINT", _ => {
  buttons.forEach(b => b.unexport());
});
