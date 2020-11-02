//
// generates a serie of pixels states from start and end pixels
// basic animation that transition from the center of the led stripe  <---*--->
//
function generateSteps(pixels1, pixels2) {
  let stepsCount = parseInt(20 / 2) + 1;
  const animationSteps = [pixels1];
  for (let i = 0; i < stepsCount; i++) {
    const pixels = new Uint32Array([
      ...animationSteps[animationSteps.length - 1],
    ]);
    pixels[10 - i] = pixels2[10 - i];
    pixels[10 + i] = pixels2[10 + i];
    animationSteps.push(pixels);
  }
  return animationSteps;
}

// some easing function. see https://easings.net/fr
function easeInOutSine(x) {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

// schedule the animation.render callbacks with expected pixels
function runLedsAnimation(render, pixels1, pixels2, duration = 1000) {
  const steps = generateSteps(pixels1, pixels2);
  steps.forEach((pixels, i) => {
    const progression = easeInOutSine(i / steps.length);
    setTimeout(() => render(pixels), duration * progression);
  });
}

module.exports = { runLedsAnimation };
