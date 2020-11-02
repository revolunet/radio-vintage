# Radio Vintage

Reconversion d'une radio vintage en station de streaming audio

![demo](./demo.gif)

Dans ce projet, l'éléctronique d'époque n'est pas du tout exploitée : uniquement les boutons physiques et le haut-parleur d'origine qui sont directement branchés sur un [RaspberryPI "headless"](https://raspberry-pi.fr/raspberry-pi-sans-ecran-sans-clavier/) sur lequel tourne un serveur audio [mopidy](https://mopidy.com/) et une application JavaScript qui permet de changer de stream en fonction du bouton pressé.

Pour améliorer la qualité de la sortie audio du raspberry qui par défaut n'est pas terrible, vous pouvez ajouter un DAC et/ou un ampli (ex: [JustBoom](https://JustBoom.co), [HifiBerry](https://www.hifiberry.com/)). J'ai opté pour un [micro ampli 3W MAX98357A](https://boutique.semageek.com/fr/810-amplificateur-i2s-3w-classe-d-max98357a.html) qui exploite le port I2S du Raspi pour fournir un audio de qualité suffisante pour ~8€ mais la puissance est un peu juste pour sonoriser une grande pièce.

#### Frontend

![frontend](./images/frontend.jpg)

Les 7 boutons poussoirs et le potentiomètre de gauche sont exploités.

#### Backend

![backend](./images/backend.jpg)

Le circuit d'origine n'est pas exploité.

#### Montage avec la RaspberryPi

```
        |----(+5V et GPIO)------- Bandeau LEDs ws2812
        |
RaspberryPi----(gpio + gnd)---- 7 boutons
        |
        |----I2S----max98357a----speaker

```

Il faut déconnecter, nettoyer et recabler chaque bouton ou potentiomètre que l'on veut exploiter.

![control-panel](./images/control-panel.jpg)

Sur ma radio, un seul bouton peut être enfoncé à la fois, donc tous ses boutons auront une masse commune et l'autre pin sur un des ports GPIO du raspberry. Le contact d'une masse+GPIO déclenchera des `événements` dans notre programme, lequel enverra des `ordres` au serveur mopidy qui gère la lecture du son via une API HTTP.

Dans mon cas les 7 boutons sont branchés sur les GPIO : 17, 27, 22, 10, 9, 11, 5 et la masse commune sur un des GND de la raspberryPI.

##### Audio et volume

⚠️ Une des difficultés (pour moi) est d'exploiter correctement le potentiomètre d'origine. Il n'a visiblement pas la bonne _impédance_? pour mon ampli du coup je n'exploite que 10% de sa course. Si vous avez des idées pour arranger cela sans changer le potentiomètre 🙏🙏🙏.

#### Software

Le serveur [Mopidy](mopidy.com) propose de nombreux plugins, par exemple spotify, somafm, youtube... et une [API http+websocket très riche](https://docs.mopidy.com/en/latest/api/core) qui permet de contrôler la diffusion.

(Une autre possibilité est d'utiliser VLC qui propose lui aussi une API http (minimale) qui permet de gérer une playlist.)

Une fois le [serveur mopidy fonctionnel](https://docs.mopidy.com/en/latest/) et lancé automatiquement au démarrage, il faudra aussi lancer un script JavaScript (ou Python) qui va pouvoir gérer les boutons de la radio à votre guise.

Avec le module [onoff](https://github.com/fivdi/onoff) c'est assez simple :

```js
const Gpio = require("onoff").Gpio;

// déclare un bouton sur le GPIO 17
const button = new Gpio(17, "in", "falling", { debounceTimeout: 50 });

// déclenche un "callback" quand le bouton est enfoncé
button.watch((err, value) => {
  if (err) {
    throw err;
  }
  console.log(`Pushed button 1 (pin 17)`);
  playStream("http://icecast.radiofrance.fr/fipreggae-midfi.mp3");
});
```

La fonction `playStream` déclenche la lecture d'un stream/fichier sur mopidy, en appelant les API `core.tracklist.add` et `core.playback.play`.

On pourra utiliser [pm2](https://pm2.keymetrics.io/) pour lancer ce script automatiquement au démarrage du RaspberryPi.

Voir le script complet : [./src/index.js](./src/index.js)

> Pour utiliser "onoff" avec les boutons en GPIO en input en mode "PullUp", ajouter ceci dans /boot/config.txt : `gpio=5,9,10,11,13,15,17,19,21,22,23,27,29=pu`

### Streams

cf [./src/buttons.js](./src/buttons.js)

### PiMusicBox

La distribution PiMusicBox est visiblement [peu active](https://github.com/pimusicbox/pimusicbox/graphs/contributors) et il est difficile d'installer des packages récents sur cette base. Il vaut mieux partir sur la [dernière Raspbian Lite](https://downloads.raspberrypi.org/raspbian_lite_latest) et [installer mopidy et ses plugins directement](https://docs.mopidy.com/en/latest/installation/).

## Ressources

- https://downloads.raspberrypi.org/raspbian_lite_latest
- https://docs.mopidy.com/en/latest/
- [JustBoom + RaspBian setup](https://www.justboom.co/software/configure-justboom-with-raspbian/)

## Related

- [my raspberry tips n tricks](https://gist.github.com/revolunet/f85a6fbe8b2688632c288f26010c9542)
- raspi as a spotify client with [raspotify](https://github.com/dtcooper/raspotify) or [PiMusicBox](https://www.pimusicbox.com/).
- [Changing a Pot's Adjustment Range](http://musicfromouterspace.com/analogsynth_new/HOT_TIPS/coarserangeadjust.html)

## Todo

- Meilleur on/off
- Potentiometer
