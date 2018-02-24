import {vc} from "./createViewingConditions";

export function nonlinearAdaptation(coneResponse, fl) {
  var c = 400;
  if (coneResponse < 0) {
    fl = fl * -1;
    c = -400;
  }
  var p = Math.pow( (fl * coneResponse) / 100.0, 0.42 );

  return ((c * p) / (27.13 + p)) + 0.1;
}


export function inverseNonlinearAdaptation(coneResponse, fl) {
  function sign(x) {
    if (x === 0) return 0;
    else if (x < 0) return -1;
    else return 1;
  }

  return sign(coneResponse - 0.1) * (100.0 / fl) *
          Math.pow((27.13 * Math.abs(coneResponse - 0.1)) /
                      (400.0 - Math.abs(coneResponse - 0.1)),
                   1.0 / 0.42);
}


export function xyz2sharpenedRGB(x, y, z) {
  // Apply the M_16 matrix to XYZ color channels to get sharpened RGB
  var r =  0.401288 * x + 0.650173 * y - 0.051461 * z,
      g = -0.250268 * x + 1.204414 * y + 0.045854 * z,
      b = -0.002079 * x + 0.048952 * y + 0.953127 * z;

  return { r : r, g: g, b: b };
}

export function sharpenedRGB2xyz(R, G, B) {
  var x = ( 1.86206786 * R) - (1.01125463 * G) + (0.14918677 * B),
      y = ( 0.38752654 * R) + (0.62144744 * G) - (0.00897398 * B),
      z = (-0.01584150 * R) - (0.03412294 * G) + (1.04996444 * B);

  return { x: x, y: y, z: z };
}


export function compute_Q(J) {
  return (4.0 / vc.c) * Math.sqrt(J / 100.0) * (vc.A_w + 4.0) * Math.pow(vc.F_L, 0.25);
}

export function compute_eccentricity(hueAngle) {
  return 0.25 * (Math.cos((hueAngle * Math.PI) / 180.0 + 2.0) + 3.8);
}

export function cam162cam16ucs(J, a, b, C, h, M) {
  J = 1.7*J / (1 + 0.007 * J);
  M = Math.log(1 + 0.0228 * M) / 0.0228;
  a = M * Math.cos((h * Math.PI) / 180.0);
  b = M * Math.sin((h * Math.PI) / 180.0);
  return { J: J, a: a, b: b, C: C, h: h, M: M };
}

export function cam16ucs2cam16(J, a, b, C, h, M) {
  // J = 1.7 * (1/J  -  0.007 / 1.7);

  // J' = 1.7 * J / (1 + 0.007 * J);
  // J' / 1. 7 = J / (1 + 0.007 * J);
  // 1.7 / J' = 1 / J + (0.007 * J) / J;
  // 1.7 / J' = 1 / J + 0.007
  // (1.7 / J') - 0.007 = 1 / J
  // 1 / ( (1.7 / J') - 0.007 ) = J
  J = J === 0 ? 0 : 1 / ( (1.7 / J) - 0.007 );

  if(h === undefined || h === null) {
      var hueAngle = ((180.0 / Math.PI) * Math.atan2(b, a));
      if (hueAngle < 0) hueAngle += 360;
      h = hueAngle
  }
  if(M === undefined || M === null) {
      // TODO verify this is correct; check for divide by 0 case?
      // SUPER TODO this is wrong; fix the tan inverse function and calculate the right brightness! that'll lead you to the correct C
      a / b = tan(h)
      M = a / Math.cos(Math.atan2(b,a));
  }

  M = 0.0228 * Math.exp(M/0.0228 - 1);
  if(C === undefined || C === null) {
      C = M / Math.pow(vc.F_L, 0.25);
  }

  console.log("C!", C, M, M / Math.pow(vc.F_L, 0.25));

  var JabObject = cam16jch2cam16jab(J, C, h),
      a = JabObject.a,
      b = JabObject.b;

  // var t = Math.pow(C / (
  //             Math.sqrt(J/100) * Math.pow(1.64 - Math.pow(0.29, vc.n), 0.73)
  //         ), 1 / 0.9);
  //
  // var a, b;
  // if (t != 0) {
  //   var e_t = 0.25 * ( Math.cos(h * Math.PI/180 + 2) + 3.8),
  //       A = vc.A_w * Math.pow(J/100.0, 1 / (vc.c * vc.z)),
  //       p1 = (50000.0/13.0 * vc.nc * vc.ncb) * e_t * (1/t),
  //       p2 = A / vc.nbb + 0.305,
  //       p3 = 21.0 / 20.0,
  //       hrad = h * Math.PI / 180.0;
  //   if (Math.abs(Math.sin(hrad)) >= Math.abs(Math.cos(hrad))) {
  //     var p4 = p1 / Math.sin(hrad);
  //     b = (p2 * (2 + p3) * (460.0 / 1403.0)) /
  //         (p4 + (2+p3) * (220.0/1403.0) * (Math.cos(hrad)/Math.sin(hrad))
  //           - (27.0/1403.0) + p3 * (6300.0/1403.0)
  //         );
  //     a = b * (Math.cos(hrad) / Math.sin(hrad));
  //   } else {
  //     var p5 = p1 / Math.cos(hrad);
  //     a = (p2 * (2+p3) * (460.0/1403.0)) /
  //         (p5 + (2+p3) * (220.0/1403.0) - ((27.0/1403.0) - p3
  //           * (6300.0/1403.0)) * (Math.sin(hrad)/Math.cos(hrad))
  //         );
  //     b = a * (Math.sin(hrad) / Math.cos(hrad));
  //   }
  // } else {
  //   a = 0;
  //   b = 0;
  // }

  return { J: J, a: a, b: b, C: C, h: h, M: M };
}

export function xyz2cam16(X, Y, Z) {
  // Step 1: Convert XYZ input to sharpened RGB values
  var RGB = xyz2sharpenedRGB(X, Y, Z);

  // Step 2: Apply D-transformed white point to sharpened RGB
  var R_c = RGB.r * vc.R_D,
      G_c = RGB.g * vc.G_D,
      B_c = RGB.b * vc.B_D;

  // Step 3: Apply nonlinear responses
  //   Returns postadaption cone response (leads to dynamic range compression)
  var R_a = nonlinearAdaptation(R_c, vc.F_L),
      G_a = nonlinearAdaptation(G_c, vc.F_L),
      B_a = nonlinearAdaptation(B_c, vc.F_L);

  // Step 4: convert to preliminary cartesian a, b AND compute hue *angle*
  //   Force the hue angle to be between 0 and 360 degrees
  var a = R_a - (12.0 * G_a / 11.0) + (B_a / 11.0),
      b = (R_a + G_a - 2.0 * B_a) / 9.0,
      hueAngle = ((180.0 / Math.PI) * Math.atan2(b, a));

  if (hueAngle < 0) hueAngle += 360;

  // Step 5: compute hue quadratrue, eccentricity, and hue composition
  // NOTE because of hue quadrature's redundancy with hue and its computational
  //      cost, it is left out from this implementation as is hue composition.
  //      e_t (eccentricity) is still computed given it's use in other measures.

  // h_i = [20.14, 90.00, 164.25, 237.53, 380.14]
  // e_i = [0.8, 0.7, 1.0, 1.2, 0.8],
  // H_i = [0.0, 100.0, 200.0, 300.0, 400.0]
  //
  // Set h' = h + 360 if h < h_0, otherwise h' = h.
  // Choose i (0, 1, 2, or 3) so that h_i <= h' < h_(i + 1)
  // he = (h' - h_i) / e_i
  // H_quadrature = H_i + (100 * he) / (he + (h_(i+1) - h'/e_(i+1)) )
  //
  // To get hue composition (e.g., 59G41B = 59% Green, 41% Blue) do:
  // P_L = H_(i+1) - H_quadrature
  // P_R = H_quadrature - H_i

  // NOTE: The CAM16 equation for h' is
  //            e_t = 0.25 * [ cos(h' * pi / 180 + 2) + 3.8]
  //       We use h rather than h' because they are equivalent for e_t.
  var e_t = compute_eccentricity(hueAngle);

  // Step 6: Compute achromatic response for input
  var A = (2.0 * R_a + G_a + 0.05 * B_a - 0.305) * vc.nbb;

  // Step 7: Compute Lightness
  var J = 100.0 * Math.pow(A / vc.A_w, vc.c * vc.z);

  // Step 8: Compute brightness
  var Q = compute_Q(J);

  // Step 9: Compute chroma
  var t = (50000.0 / 13.0) * vc.nc * vc.ncb * e_t * Math.sqrt(a*a + b*b) /
          (R_a + G_a + (21.0/20.0)*B_a),
      C = Math.pow(t, 0.9) * Math.sqrt(J / 100.0) * Math.pow(1.64 - Math.pow(0.29, vc.n), 0.73);

  // Step 10: Compute colorfulness
  var M = C * Math.pow(vc.F_L, 0.25);

  // Step 11: Compute saturation
  var s = 100.0 * Math.sqrt(M / Q);

  // Convert J, M, a, b, and h to uniform color space equivalents
  // We override the default values because for visualization linear
  // interpolability is important.
  // NOTE UCS h is equivalent to h. It's unknown whether the same applies to
  //    Brightness, Chroma and Saturation.
  var _nonUCSJ = J,
      _nonUCSa = a,
      _nonUCSb = b,
      _nonUCSM = M;

  J = 1.7 * J / (1 + 0.007 * J);
  M = Math.log(1 + 0.0228 * M) / 0.0228; // in JS log = ln
  a = M * Math.cos((hueAngle * Math.PI) / 180.0);
  b = M * Math.sin((hueAngle * Math.PI) / 180.0);

  // Return the achromatic response and non-UCS Jab to speed up reverse
  // transforms to XYZ
  return {
    J: J, a: a, b: b, C: C, Q: Q, M: M, s: s, h: hueAngle,
    _achromaticResponse: A,
    _nonUCSJ: _nonUCSJ, _nonUCSa: _nonUCSa, _nonUCSb:_nonUCSb,
    _nonUCSM: _nonUCSM
  };
}


// Hue angle is expected to be in degrees
export function cam16jch2cam16jab(J, C, h) {
  var A = vc.A_w * Math.pow(J/100.0, 1 / (vc.c * vc.z));

  var t = Math.pow(C / (
              Math.sqrt(J/100) * Math.pow(1.64 - Math.pow(0.29, vc.n), 0.73)
          ), 1 / 0.9),
      e_t = compute_eccentricity(h);

  console.log("T", t, "J", J);
  if (J === 0 || t === 0) {
    return { J : J, a: 0, b: 0, C: C, h: h }
    // return new CAM16(J, 0, 0, C, h, opacity);
  }

  var hrad = h * (Math.PI / 180);

  var p1 = ( (50000/13) * vc.nc * vc.ncb ) * e_t * (1/t),
      p2 = A / vc.nbb + 0.305,
      p3 = 21/20;

  var a, b;

  if (Math.abs(Math.sin(hrad)) >= Math.abs(Math.cos(hrad))) {
    var p4 = p1 / Math.sin(hrad);
    b = ( p2 * (2 + p3) + 460.0 / 1403.0 ) /
          (
            p4 + (2 + p3) * (220.0 / 1403.0) * (Math.cos(hrad) / Math.sin(hrad))
            - (27.0 / 1403.0) + p3 * (6300.0 / 1403.0)
          );
    a = b * (Math.cos(hrad) / Math.sin(hrad));
  } else {
    var p5 = p1 / Math.cos(hrad);
    a = ( p2 * (2 + p3) * (460 / 1403) ) /
          (
            p5 + (2 + p3) * (220.0 / 1403.0)
            - ((27.0 / 1403) - p3 * (6300.0/1403.0)) * (Math.sin(hrad) / Math.cos(hrad))
          );
    b = a * (Math.sin(hrad) / Math.cos(hrad));
  }

  return { J : J, a: a, b: b, C: C, h: h };
}


// NOTE this function expects a and b to in a [-1, 1] scale, not [-100,100].
export function cam162xyz(cam16) {
  console.log("cam162xyz:", cam16);
  // Function starts at Step 2, given that Steps 1 is to determine J, C, and h.

  // Step 2: Calcualte t, e_t, A, p1, p2, and p3
  // Step 3: Calculate a and b
  // Rescale based on hue to avoid magnitude issues. Even in the CAM16 paper
  // they use different bases, which makes conversions extremely bug prone.
  // By reconverting with h we can avoid these.
  var J = cam16._nonUCSJ,
      C = cam16.C,
      h = cam16.h,
      JabObject = cam16jch2cam16jab(J, C, h),
      a = JabObject.a,
      b = JabObject.b;

  console.log("!")
  console.log(JabObject);
  console.log("!")

  // Step 4: Compute the achromatic transformed sharpened RGB values
  //   We compute hue as an intermediary step to standardize the range of a and
  //   b. Some definitions expect it on a unit scale, which creates problems.
  var A = vc.A_w * Math.pow(J/100.0, 1 / (vc.c * vc.z)),
      p_2 = A / vc.nbb + 0.305;

  var R_a = (460/1403) * p_2 + (451/1403) * a + (288/1403) * b, // (460 * p_2 + 451 * a + 288 * b) / 1403,
      G_a = (460/1403) * p_2 - (891/1403) * a - (261/1403) * b,// (460 * p_2 - 891 * a - 261 * b) / 1403,
      B_a = (460/1403) * p_2 - (220/1403) * a - (6300/1403) * b;// (460 * p_2 - 220 * a - 6300 * b) / 1403;

  // Step 5: Reverse nonlinear compression
  var R_c = inverseNonlinearAdaptation(R_a, vc.F_L),
      G_c = inverseNonlinearAdaptation(G_a, vc.F_L),
      B_c = inverseNonlinearAdaptation(B_a, vc.F_L);

  // Step 6: Undo the degree of adaptation to obtain sharpened RGB values
  var R = R_c / vc.R_D,
      G = G_c / vc.G_D,
      B = B_c / vc.B_D;

  // Step 4: Convert sharpened RGB to XYZ
  var XYZ = sharpenedRGB2xyz(R, G, B);

  return XYZ;
}
