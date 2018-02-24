import {nonlinearAdaptation, xyz2sharpenedRGB} from "./cam16Definition";
// TODO precompute viewing conditions to use as a constant and reduce runtime
//      BUT also keep this in a resources file for instructions.
// TODO consider making this a run-script option to generate a viewing
//      condition object that can be imported by CAM16.
export var vc = (function() {
  // CIECAM16_VC viewing conditions; assumes average viewing conditions
  var vc = {
    D65_X: 95.047, // D65 standard referent
    D65_Y: 100.0,
    D65_Z: 108.883,
    // Viewing conditions
    // Note about L_A:
    // Billy Bigg's CAM02 implementation just uses a value of 4 cd/m^2, but
    // the colorspacious implementation uses greater precision by calculating
    // it with (64 / numpy.pi) / 5
    // This is based on Moroney (2000), "Usage guidelines for CIECAM97s" where
    // sRGB illuminance is 64 lux. Because of its greater precision we use
    // Moroney's alternative definition.
    //
    // CAM16 L_A definition: (Y_W = D65_Y)
    // L_A = (E_W / PI) * (Y_b / Y_W) = (L_W *Y_b) / Y_W,
    //    where E_W = PI * L_W, L i sluminance of reference white in cd/m^2,
    //    Y_b is the luminance factor of the background, Y_W is luminance of
    //    reference white.
    // This is the same equation as the CAM02 specification.
    // For CAM02 on Wikipedia it is suggested that if L_A is unknown then you
    // should assume average reflectance (gray world assumption): L_A = L_W / 5
    L_A: (64.0 / Math.PI) / 5.0, // Python colour science uses 318.31
    Y_b: 20.0, // 20% gray
    // Surround (this assumes average viewing conditions)
    f: 1.0,  // dim: 0.9;  dark: 0.8
    c: 0.69, // dim: 0.59; dark: 0.525
    nc: 1.0  // dim: 0.9;  dark: 0.8
  };

  var RGB_w = xyz2sharpenedRGB(vc.D65_X, vc.D65_Y, vc.D65_Z);

  // Degree of adaptation "D"
  vc.D = vc.f * ( 1.0 - (1.0 / 3.6) * Math.exp((-vc.L_A - 42.0) / 92.0) );
  if (vc.D > 1) vc.D = 1;
  else if (vc.D) vc.D = 0;

  // Viewing condition dependent parameters
  vc.n = vc.Y_b / vc.D65_Y;

  var k = 1.0 / ((5.0 * vc.L_A) + 1.0);
  vc.F_L = (0.2 * Math.pow(k, 4.0) * (5.0 * vc.L_A))
            + 0.1 * Math.pow(1.0 - Math.pow(k, 4.0), 2.0)
            * Math.pow(5.0 * vc.L_A, 1.0/3.0);

  vc.nbb = 0.725 * Math.pow(1.0 / vc.n, 0.2);
  vc.ncb = vc.nbb;
  vc.z = 1.48 + Math.sqrt(vc.n);

  // Transform RGB_w by the degree of adaptation
  vc.R_D = ((vc.D65_Y * vc.D) / RGB_w.r) + (1.0 - vc.D);
  vc.G_D = ((vc.D65_Y * vc.D) / RGB_w.g) + (1.0 - vc.D);
  vc.B_D = ((vc.D65_Y * vc.D) / RGB_w.b) + (1.0 - vc.D);

  var R_wc = RGB_w.r * vc.R_D,
      G_wc = RGB_w.g * vc.G_D,
      B_wc = RGB_w.b * vc.B_D;

  var R_aw = nonlinearAdaptation(R_wc, vc.F_L),
      G_aw = nonlinearAdaptation(G_wc, vc.F_L),
      B_aw = nonlinearAdaptation(B_wc, vc.F_L);

  // Compute achromatic response for whitepoint
  vc.A_w = (2.0 * R_aw + G_aw + 0.05 * B_aw - 0.305) * vc.nbb;

  return vc;
})();
