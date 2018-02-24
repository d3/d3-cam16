var tape = require("tape"),
    d3 = require("../build/d3-cam16.js");

tape("cam16 converts blue correctly", function(test) {
  test.equal(d3.cam16.fromColor("rgb(0,0,255)").rgb().g, 255);
  test.end();
});
