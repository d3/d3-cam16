var tape = require("tape"),
    cam16 = require("../build/cam16Definition.js");

console.log(cam16)

tape("xyz2sharpenedRGB uses makes black", function(test) {
  var c1 = cam16.xyz2sharpenedRGB(0, 0, 0);

  test.equal(c1.r, 0);
  test.equal(c1.g, 0);
  test.equal(c1.b, 0);
  test.end();
});


tape("xyz to sharpened RGB to xyz does not introduce distortion.", function(test) {
  var c1 = cam16.xyz2sharpenedRGB(0, 0, 0),
      c2 = cam16.sharpenedRGB2xyz(c1.r, c1.g, c1.b);

  test.equal(c2.x, 0);
  test.equal(c2.y, 0);
  test.equal(c2.z, 0);

  var x = 57, y = 23, z = 40;
  c1 = cam16.xyz2sharpenedRGB(x, y, z);
  c2 = cam16.sharpenedRGB2xyz(c1.r, c1.g, c1.b);

  test.equal(Math.round(c2.x), x);
  test.equal(Math.round(c2.y), y);
  test.equal(Math.round(c2.z), z);

  test.end();
});


tape("nonlinearAdaptation does not introduce distortion.", function(test) {
  var F_l = 0.27313053667320736; // taken from viewing conditions

  var c1 = cam16.nonlinearAdaptation(0, F_l),
      c2 = cam16.inverseNonlinearAdaptation(c1, F_l);
  test.equal(0, c2);

  c1 = cam16.nonlinearAdaptation(100, F_l),
  c2 = cam16.inverseNonlinearAdaptation(c1, F_l);
  test.equal(100, c2);

  c1 = cam16.nonlinearAdaptation(23, F_l),
  c2 = cam16.inverseNonlinearAdaptation(c1, F_l);
  test.equal(23, Math.round(c2));

  test.end();
});

tape("cam16 -> ucs -> cam16.", function(test) {
  var c1 = cam16.cam162cam16ucs(50, 0, 0, 0, 0, 0),
      c2 = cam16.cam16ucs2cam16(c1.J, c1.a, c1.b, c1.C, c1.h, c1.M);

  test.equal(c2.J, 50, "Achromatic J:50 16 -> UCS -> 16 conversion OK");
  test.equal(c2.a, 0, "Achromatic a: 0 16 -> UCS -> 16 conversion OK");
  test.equal(c2.b, 0, "Achromatic b: 0 16 -> UCS -> 16 conversion OK");

  c1 = cam16.cam162cam16ucs(50, -1.088736746861073, 1.333317972157515e-16, 100.0, 180, 72.29238694926879);
  c2 = cam16.cam16ucs2cam16(c1.J, c1.a, c1.b, c1.C, c1.h, c1.M);

  test.equal(c2.J, 50, "Chromatic J:50 16 -> UCS -> 16 conversion OK");
  test.equal(c2.C, 100, "Chromatic C: 100 16 -> UCS -> 16 conversion OK");
  test.equal(c2.h, 180, "Chromatic h: 180 16 -> UCS -> 16 conversion OK");
  test.equal(Math.round(c2.a), -1, "Chromatic a: ~1 16 -> UCS -> 16 conversion OK");
  test.equal(Math.round(c2.b), 0, "Chromatic a: ~0 16 -> UCS -> 16 conversion OK");

  test.end();
});

tape("cam162xyz converts black correctly.", function(test) {
  var c = cam16.cam162xyz({_nonUCSJ: 0, _nonUCSa: 0, _nonUCSb: 0, C: 0, h: 0});
  test.equal(Math.round(c.x), 0);
  test.equal(Math.round(c.y), 0);
  test.equal(Math.round(c.z), 0);
  test.end();
});

tape("xyz2cam16 converts white correctly (some distortion may apply).", function(test) {
  var c = cam16.xyz2cam16(100,100,100);
  test.equal(Math.round(c.J), 100);
  test.equal(Math.round(c.a), 0);
  test.equal(Math.round(c.b), 0);
  test.end();
});

tape("cam16xyz converts white correctly (some distortion may apply).", function(test) {
  var c = cam16.cam162xyz({_nonUCSJ: 100, _nonUCSa: 0, _nonUCSb: 0, C: 0, h: 0}),
      x = c.x,
      y = c.y,
      z = c.z;

  test.equal(x <= 100 && x > 99, true);
  test.equal(y <= 100 && y > 99, true);
  test.equal(z <= 100 && z > 99, true);
  test.end();
});

tape("cam16 -> xyz -> cam16 succeeds", function(test) {
  // In general there's something weird going on with xyz2cam16 given that
  //   the cam16 preview works fine which is a conversion from cam16 to rgb.
  var c1 = cam16.cam162xyz({_nonUCSJ: 50, _nonUCSa:0, _nonUCSb:0, C: 0, h: 0}),
      c2 = cam16.xyz2cam16(c1.x, c1.y, c1.z);

  test.equal(Math.round(c2._nonUCSJ), 50, "Achromatic J 50");
  test.equal(Math.round(c2._nonUCSa), 0, "Achromatic a");
  test.equal(Math.round(c2._nonUCSb), 0, "Achromatic b");

  var c1 = cam16.cam162xyz({_nonUCSJ: 20, _nonUCSa:0, _nonUCSb:0, C: 0, h: 0}),
      c2 = cam16.xyz2cam16(c1.x, c1.y, c1.z);

  test.equal(Math.round(c2._nonUCSJ), 20, "Achromatic J 20");
  test.equal(Math.round(c2._nonUCSa), 0, "Achromatic a");
  test.equal(Math.round(c2._nonUCSb), 0, "Achromatic b");

  var c1 = cam16.cam162xyz({_nonUCSJ: 50, _nonUCSa:-20, _nonUCSb:0, C: 915.996105403213, h: 180}),
      c2 = cam16.xyz2cam16(c1.x, c1.y, c1.z);

  test.equal(Math.round(c2._nonUCSJ), 50, "Chromatic J 50");
  test.equal(Math.round(c2._nonUCSa), -20, "Chromatic a -20");
  test.equal(Math.round(c2._nonUCSb), 0, "Chromatic b 0");

  test.end();
});


// TODO test M conversions
// TODO test C conversions
