const Gpio = require("onoff").Gpio;
const fetch = require("node-fetch");
const { playStream } = require("./mopidy");

// define a callback for each GPIO.
const buttonsMapping = [
  {
    pin: 17,
    callback: () => {
      playStream("http://icecast.radiofrance.fr/fip-midfi.mp3");
    }
  },
  {
    pin: 27,
    callback: () => {
      playStream("http://icecast.radiofrance.fr/fipjazz-midfi.mp3");
    }
  },
  {
    pin: 22,
    callback: () => {
      playStream("http://icecast.radiofrance.fr/fipreggae-midfi.mp3");
    }
  },
  {
    pin: 10,
    callback: () => {
      playStream("http://direct.franceinfo.fr/live/franceinfo-midfi.mp3");
    }
  },
  {
    pin: 9,
    callback: () => {}
  },
  {
    pin: 11,
    callback: () => {}
  },
  {
    pin: 5,
    callback: () => {}
  }
];

let lastPin;

const buttons = buttonsMapping.map((mapping, idx) => {
  const button = new Gpio(mapping.pin, "in", "falling", {
    debounceTimeout: 50
  });
  button.watch((err, value) => {
    if (err) {
      throw err;
    }
    console.log(`Pushed button ${idx + 1} (pin ${mapping.pin})`);
    if (lastPin === mapping.pin) {
      console.log(`Skip`);
    } else {
      mapping.callback();
    }
    lastPin = mapping.pin;
  });
  return button;
});

process.on("SIGINT", _ => {
  buttons.forEach(b => b.unexport());
});
