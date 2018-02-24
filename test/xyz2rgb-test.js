var tape = require("tape"),
    cam16 = require("../build/xyz2rgb.js");

tape("rgb2xyz: black", function(test) {
  var black = cam16.rgb2xyz(0, 0, 0);
  test.equal(black.x === 0 && black.y === 0 && black.z === 0, true);
  test.end();
});

tape("rgb2xyz: white", function(test) {
  function eq(d, truth) { return Math.round(d) === truth; }
  var white = cam16.rgb2xyz(255, 255, 255);

  test.equal(eq(white.x, 95) && eq(white.y, 100) && eq(white.z, 109), true);
  test.end();
});

tape("rgb2xyz: blue", function(test) {
  function eq(d, truth) { return d === truth; }
  var blue = cam16.rgb2xyz(0, 0, 255);

  test.equal(eq(blue.x, 18.05) && eq(blue.y, 7.22) && eq(blue.z, 95.05), true);
  test.end();
});
