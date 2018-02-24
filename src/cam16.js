// TODO debug differences between to RGB and from RGB and fromJab
import {color, rgb} from "d3-color";

import {vc} from "./viewingConditions";
import {cam162xyz, compute_eccentricity, compute_Q, xyz2cam16,
        cam162cam16ucs, cam16ucs2cam16, cam16jch2cam16jab} from "./cam16Definition";
import {rgb2xyz, xyz2rgb} from "./xyz2rgb";

// TODO rounding error: fromJab and fromJCh return different responses


export default function cam16() { }
cam16.fromColor = function(o) { return cam16Convert(o); }
cam16.fromNonUcsJab = function(J, a, b, opacity) {
  return new CAM16(J, a, b, opacity);
}
cam16.fromJCh = function(J, C, h, opacity) {
  // var A = vc.A_w * Math.pow(J/100.0, 1 / (vc.c * vc.z));
  //
  // var t = Math.pow(C / (
  //             Math.sqrt(J/100) * Math.pow(1.64 - Math.pow(0.29, vc.n), 0.73)
  //         ), 1 / 0.9),
  //     e_t = compute_eccentricity(h);
  //
  // if (t === 0) {
  //   return new CAM16(J, 0, 0, C, h, opacity);
  // }
  //
  // var hrad = h * (Math.PI / 180);
  //
  // var p1 = ( (50000/13) * vc.nc * vc.ncb ) * e_t * (1/t),
  //     p2 = A / vc.nbb + 0.305,
  //     p3 = 21/20;
  //
  // var a, b;
  //
  // if (Math.abs(Math.sin(hrad)) >= Math.abs(Math.cos(hrad))) {
  //   var p4 = p1 / Math.sin(hrad);
  //   b = ( p2 * (2 + p3) + 460.0 / 1403.0 ) /
  //         (
  //           p4 + (2 + p3) * (220.0 / 1403.0) * (Math.cos(hrad) / Math.sin(hrad))
  //           - (27.0 / 1403.0) + p3 * (6300.0 / 1403.0)
  //         );
  //   a = b * (Math.cos(hrad) / Math.sin(hrad));
  // } else {
  //   var p5 = p1 / Math.cos(hrad);
  //   a = ( p2 * (2 + p3) * (460 / 1403) ) /
  //         (
  //           p5 + (2 + p3) * (220.0 / 1403.0)
  //           - ((27.0 / 1403) - p3 * (6300.0/1403.0)) * (Math.sin(hrad) / Math.cos(hrad))
  //         );
  //   b = a * (Math.sin(hrad) / Math.cos(hrad));
  // }
  var JabObject = cam16jch2cam16jab(J, C, h);

  return new CAM16(JabObject.J, JabObject.a, JabObject.b, C, h, opacity);
}


// TODO consider taking out conditions in CAM16 and move them to fromJab();
function CAM16(J, a, b, opacity) {
  var J, a, b, C, h, opacity;
  if (arguments.length !== 4 && arguments.length != 6) {
    console.error("Invalid number of CAM16 constructor arguments. Received "
        + arguments.length + " but expected 4 or 6.");
    return undefined;
  }
  if (arguments.length >= 4) {
    J = arguments[0];
    a = arguments[1];
    b = arguments[2];
  }
  if (arguments.length === 4) {
    opacity = arguments[3];
  } else {
    C = arguments[3];
    h = arguments[4];
    opacity = arguments[5];
  }

  if (h === undefined) {
    h = ((180.0 / Math.PI) * Math.atan2(b, a));
    if (h < 0) h += 360;
  }

  if (C === undefined) {
    var A = vc.A_w * Math.pow(J/100.0, 1 / (vc.c * vc.z)),
        p_2 = A / vc.nbb + 0.305;

    var R_a = (460 * p_2 + 451 * a + 288 * b) / 1403,
        G_a = (460 * p_2 - 891 * a - 261 * b) / 1403,
        B_a = (460 * p_2 - 220 * a - 6300 * b) / 1403;

    var e_t = compute_eccentricity(h),
        t = (50000.0 / 13.0) * vc.nc * vc.ncb * e_t * Math.sqrt(a*a + b*b) /
            (R_a + G_a + (21.0/20.0)*B_a),
        C = Math.pow(t, 0.9) * Math.sqrt(J / 100.0) * Math.pow(1.64 - Math.pow(0.29, vc.n), 0.73);
  }

  var Q = compute_Q(J),
      M = C * Math.pow(vc.F_L, 0.25),
      s = 100.0 * Math.sqrt(M / Q);

  var ucscam = cam162cam16ucs(J, a, b, C, h, M);

  var _nonUCSJ = J,
      _nonUCSa = a,
      _nonUCSb = b,
      _nonUCSM = M;

  this.J = ucscam.J;
  this.a = ucscam.a;
  this.b = ucscam.b;
  this.C = C;
  this.h = h;
  this.Q = Q;
  this.M = ucscam.M;
  this.s = s;
  this.opacity = opacity;
  this._nonUCSJ = _nonUCSJ;
  this._nonUCSa = _nonUCSa;
  this._nonUCSb = _nonUCSb;
  this._nonUCSM = _nonUCSM;
  // this.ucs = ucscam;
}


var cam16Prototype = CAM16.prototype = cam16.prototype = Object.create(color.prototype);
cam16Prototype.constructor = CAM16;

cam16Prototype.rgb = function() {
  console.log("RGB Jab", this);
  // var xyz = cam162xyz({J:this.J, a:this.a/100, b:this.b/100}),

  // TODO this conditional block may not be necessary, but is important to verify
  // that we use non-ucs Jab to convert.
  if(this._nonUCSJ === undefined
    || this._nonUCSa === undefined
    || this._nonUCSb === undefined) {
    var nonUcs = cam16ucs2cam16(this.J, this.a, this.b, this.C, this.h, this.M);
    this._nonUCSJ = nonUcs.J;
    this._nonUCSa = nonUcs.a;
    this._nonUCSb = nonUcs.b;
  }
  var xyz = cam162xyz(this),
      conversion = xyz2rgb(xyz.x, xyz.y, xyz.z);

  return rgb(conversion.r, conversion.g, conversion.b, this.opacity);
}

function cam16Convert(o) {
  if (o instanceof CAM16) return new CAM16(o.J, o.a, o.b, o.C, o.h, o.opacity);
  if (!(o instanceof rgb)) o = rgb(o);

  // rgb2xyz works in [0,1], but xyz2cam16 works in [0,100]
  var xyz = rgb2xyz(o.r, o.g, o.b),
      cam16 = xyz2cam16(xyz.x, xyz.y, xyz.z);

  return new CAM16(cam16.J, cam16.a, cam16.b, cam16.C, cam16.h, o.opacity);
}


function interpolateChannel(start, end) {
  // TODO import color function from d3-interpolate
  // constant, linear, and colorInterpolate are taken from d3-interpolate
  // the colorInterpolate function is `nogamma` in the d3-interpolate's color.js
  function constant(x) { return function() { return x; } }
  function linear(a, d) { return function(t) { return a + t * d; }; }
  function colorInterpolate(a, b) {
    var d = b - a;
    return d ? linear(a, d) : constant(isNaN(a) ? b : a);
  }

  return colorInterpolate(start, end);
}


export function interpolateCam16(start, end) {
  console.log(start, end);
  // TODO create expedited conversion functions that only compute the
  //    required parameters to convert to and from RGB
  start = cam16Convert(start);
  end = cam16Convert(end);

  // TODO change J, a, and b to reflect uniform color space coordinates?
  var J = interpolateChannel(start.J, end.J),
      a = interpolateChannel(start.a, end.a),
      b = interpolateChannel(start.b, end.b),
      C = interpolateChannel(start.C, end.C),
      h = interpolateChannel(start.h, end.h),
      Q = interpolateChannel(start.Q, end.Q),
      M = interpolateChannel(start.M, end.M),
      s = interpolateChannel(start.s, end.s),
      opacity = interpolateChannel(start.opacity, end.opacity);

  console.log("---")
  console.log("start",start)
  console.log("end",end)
  console.log("J",start.J, end.J, J(0));
  console.log("a",start.a, end.a, a(0));
  console.log("b",start.b, end.b, b(0));
  // console.log("no denom",d3.cam16.fromJab(J(0), a(0), b(0)).rgb());
  // console.log("denom", d3.cam16.fromJab(J(0), a(0)/100, b(0)/100).rgb());

  return function(t) {
    console.log("] start interp", t, start);
    start.J = J(t);
    start.a = a(t);
    start.b = b(t);
    start.C = C(t);
    start.h = h(t);
    start.Q = Q(t);
    start.M = M(t);
    start.s = s(t);
    start.opacity = opacity(t);

    // TODO don't interpolate on anything other than J, a, b
    // var nonUcs = cam16ucs2cam16(start.J, start.a, start.b, start.C, start.h, start.M);
    var nonUcs = cam16ucs2cam16(start.J, start.a, start.b);
    start._nonUCSJ = nonUcs.J;
    start._nonUCSa = nonUcs.a;
    start._nonUCSb = nonUcs.b;
    start.C = nonUcs.C;
    start.h = nonUcs.h;

    // TODO refactor this call into a more efficient common source code variant
    console.log(nonUcs);

    return start + "";
  };
}
