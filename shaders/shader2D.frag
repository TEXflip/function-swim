#version 430
uniform float T;
uniform vec2 aspect_ratio = vec2(16.,9.)/9.;
uniform vec2 mouse = vec2(0.,0.);
uniform float zoom = 20.;
uniform float color_range = 0.5;
// uniform float color_shift = 0.;
uniform int fun_select = 0;


// 0 = only function
// 1 = only derivative
// 2 = function and derivative
// 3 = derivative and function
uniform int render_mode = 0;

// in vec2 v_uv: screen space coordniate
in vec2 v_uv;
// out color
out vec4 out_color;
const float PI = 3.1415926535897932384626433832795;
const float SQRT2 = 1.4142135623730950488016887242097;
const float E = 2.7182818284590452353602874713527;

float blendOverlay(float base, float blend) {
	return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
}

vec3 blendOverlay(vec3 base, vec3 blend) {
	return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
}

vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
	return (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 cm_viridis(float t) {
    if (abs(t-0.5) > 0.5)
        return vec3(1.);

    const vec3 c0 = vec3(0.2777273272234177, 0.005407344544966578, 0.3340998053353061);
    const vec3 c1 = vec3(0.1050930431085774, 1.404613529898575, 1.384590162594685);
    const vec3 c2 = vec3(-0.3308618287255563, 0.214847559468213, 0.09509516302823659);
    const vec3 c3 = vec3(-4.634230498983486, -5.799100973351585, -19.33244095627987);
    const vec3 c4 = vec3(6.228269936347081, 14.17993336680509, 56.69055260068105);
    const vec3 c5 = vec3(4.776384997670288, -13.74514537774601, -65.35303263337234);
    const vec3 c6 = vec3(-5.435455855934631, 4.645852612178535, 26.3124352495832);

    return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));

}

vec3 cm_magma(float t) {
    if (abs(t-0.5) > 0.5)
        return vec3(1.);

    const vec3 c0 = vec3(-0.002136485053939582, -0.000749655052795221, -0.005386127855323933);
    const vec3 c1 = vec3(0.2516605407371642, 0.6775232436837668, 2.494026599312351);
    const vec3 c2 = vec3(8.353717279216625, -3.577719514958484, 0.3144679030132573);
    const vec3 c3 = vec3(-27.66873308576866, 14.26473078096533, -13.64921318813922);
    const vec3 c4 = vec3(52.17613981234068, -27.94360607168351, 12.94416944238394);
    const vec3 c5 = vec3(-50.76852536473588, 29.04658282127291, 4.23415299384598);
    const vec3 c6 = vec3(18.65570506591883, -11.48977351997711, -5.601961508734096);

    return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
}

// functions of optimization problems

vec2 sphere(vec2 c){
    float x = c.x;
    float y = c.y;
    
    float f = x*x + y*y;

    float grad = sqrt(4*x*x + 4*y*y);

    return vec2(f, grad)/1000.;
}

vec2 rastrigin(vec2 c){
    float x = c.x;
    float y = c.y;

    float f = x*x - 10. * cos(2. * PI * x) + 10. + y*y - 10. * cos(2. * PI * y) + 10.;

    float dx = 2 * x + 62.8319 * sin(6.28319 * x);
    float dy = 2 * y + 62.8319 * sin(6.28319 * y);
    float grad = sqrt(dx*dx + dy*dy);
    // float grad = abs(dx) * abs(dy);

    return vec2(f, grad)/50.;
}

vec2 ackley(vec2 c){
    float x = c.x;
    float y = c.y;

    float f = -20. * exp(-0.2 * sqrt(0.5 * (x * x + y * y))) - exp(0.5 * (cos(2. * PI * x) + cos(2. * PI * y))) + E + 20.;

    float dx = (2.82843*x)/(exp(0.141421*sqrt(x*x + y*y))*sqrt(x*x + y*y)) + 3.14159*exp(0.5*(cos(6.28319*x) + cos(6.28319*y)))*sin(6.28319*x);
    float dy = (2.82843*y)/(exp(0.141421*sqrt(x*x + y*y))*sqrt(x*x + y*y)) + 3.14159*exp(0.5*(cos(6.28319*x) + cos(6.28319*y)))*sin(6.28319*y);
    float grad = sqrt(dx*dx + dy*dy);

    return vec2(f, grad)/2.;
}

vec2 griewank(vec2 c){
    float x = c.x;
    float y = c.y;

    float f = 1. + (x * x / 4000.) + (y * y / 4000.) - cos(x) * cos(y / SQRT2);

    float dx = 0.0005*x + cos(y/SQRT2)*sin(x);
    float dy = 0.0005*y + 0.707107*cos(x)*sin(y/SQRT2);
    float grad = sqrt(dx*dx + dy*dy);

    return vec2(f, grad) * 2.;
}

vec2 rosenbrock(vec2 c){
    c += 1.;  // center the optimial value to (0,0)
    float x = c.x;
    float y = c.y;

    float f = 100. * (y - x * x) * (y - x * x) + (1. - x) * (1. - x);

    float dx = 400. * x * x * x + x * (2. - 400.*y) - 2.;
    float dy = 200. * (y - x * x);
    float grad = sqrt(dx*dx + dy*dy);

    return vec2(f, grad)/1000000.;
}

vec2 schwefel(vec2 c){
    c += 420.968746; // center the optimial value to (0,0)
    float x = c.x;
    float y = c.y;

    float f = 418.9829 * 2. - x * sin(sqrt(abs(x))) - y * sin(sqrt(abs(y)));

    float dx = -(x*x*cos(sqrt(abs(x))))/pow(2*abs(x), 1.5) - sin(sqrt(abs(x)));
    float dy = -(y*y*cos(sqrt(abs(y))))/pow(2*abs(y), 1.5) - sin(sqrt(abs(y)));
    float grad = sqrt(dx*dx + dy*dy);

    return vec2(f*0.02, grad*4.);
}

vec2 bukin(vec2 c){
    float x = c.x - 10.;
    float y = c.y + 1.;

    float f = 100. * sqrt(abs(y - 0.01 * x * x)) + 0.01 * abs(x + 10.);

    float dx = (0.01 * (10 + x))/abs(10 + x) - (x * (-0.01 * x * x + y))/pow(abs(-0.01 * x * x + y), 1.5);
    float dy = (50. * (-0.01 * x * x + y))/pow(abs(-0.01 * x * x + y), 1.5);
    float grad = sqrt(dx*dx + dy*dy);

    return vec2(f, grad)/50.;
}

vec2 drop_wave(vec2 c){
    float x = c.x;
    float y = c.y;

    float f = -(1.+ cos(12. * sqrt(x * x + y * y))) / (0.5 * (x * x + y * y) + 2.);

    float d1 = (1 + cos(12*sqrt(x*x + y*y)) + ((24 + 6*x*x + 6*y*y)*sin(12*sqrt(x*x + y*y)))/sqrt(x*x + y*y));
    float d2 = pow((2 + 0.5*(x*x + y*y)), 2);
    float dx = (x*d1)/d2;
    float dy = (y*d2)/d2;
    float grad = sqrt(dx*dx + dy*dy);

    return vec2(f+1., grad)/5.;
}

vec2 eggholder(vec2 c){
    // usually evaluated on the square xi ∈ [-512, 512], so there are better minimas outside the square
    // and the colors are not good
    float x = c.x + 512.;
    float y = c.y + 404.2319;

    float f = -(y + 47.) * sin(sqrt(abs(x / 2. + y + 47.))) - x * sin(sqrt(abs(x - (y + 47.))));

    float dx = (-0.5*x*(-47 + x - y)*cos(sqrt(abs(47 - x + y))))/pow(abs(47 - x + y),1.5) - (0.25*(47 + y)*(47 + 0.5*x + y)*cos(sqrt(abs(47 + 0.5*x + y))))/pow(abs(47 + 0.5*x + y),1.5) - sin(sqrt(abs(47 - x + y)));
    float dy = ((x*(-47 + x - y)*cos(sqrt(abs(47 - x + y))))/pow(abs(47 - x + y),1.5) - ((47 + y)*(47 + 0.5*x + y)*cos(sqrt(abs(47 + 0.5*x + y))))/pow(abs(47 + 0.5*x + y),1.5) - 2*sin(sqrt(abs(47 + 0.5*x + y))))/2.;
    float grad = sqrt(dx*dx + dy*dy);

    return vec2((f + 959.6407)*0.02, grad*10.);
}

vec2 holder_table(vec2 c){
    // dont go outside xi ∈ [-10, 10] !!!
    float x = c.x + 8.05502;
    float y = c.y + 9.66459;

    float f = -abs(sin(x) * cos(y) * exp(abs(1. - sqrt(x * x + y * y) / PI)));

    // gradient TODO
    // dx = (-0.101321 E^Abs[1 - 0.31831 Sqrt[x^2 + y^2]] Cos[y]^2 Sin[x] (Pi^2 Sqrt[x^2 + y^2] Abs[1 - 0.31831 Sqrt[x^2 + y^2]] Cos[x] + x (-3.14159 + Sqrt[x^2 + y^2]) Sin[x]))/(Sqrt[x^2 + y^2] Abs[1 - 0.31831 Sqrt[x^2 + y^2]] Abs[Cos[y] Sin[x]])
    // dy = (-0.101321 E^Abs[1 - 0.31831 Sqrt[x^2 + y^2]] Cos[y] Sin[x]^2 (y (-3.14159 + Sqrt[x^2 + y^2]) Cos[y] - 9.8696 Sqrt[x^2 + y^2] Abs[1 - 0.31831 Sqrt[x^2 + y^2]] Sin[y]))/(Sqrt[x^2 + y^2] Abs[1 - 0.31831 Sqrt[x^2 + y^2]] Abs[Cos[y] Sin[x]])

    return vec2((f+19.2085)*0.2, 1.);
}

vec2 shaffer(vec2 c){
    float x = c.x;
    float y = c.y;

    float f = 0.5 + (sin(x + y) + (x - y) * (x - y) - 0.5 * (x + y)) * (sin(x + y) + (x - y) * (x - y) - 0.5 * (x + y)) / (1. + 0.001 * (x + y) * (x + y));

    // dx = (((x - y)^2 - 0.5 (x + y) + Sin[x + y]) (2 (1 + 0.001 (x + y)^2) (-0.5 + 2 x - 2 y + Cos[x + y]) - 0.002 (x + y) ((x - y)^2 - 0.5 (x + y) + Sin[x + y])))/(1 + 0.001 (x + y)^2)^2
    // dy = (((x - y)^2 - 0.5 (x + y) + Sin[x + y]) (2 (1 + 0.001 (x + y)^2) (-0.5 - 2 x + 2 y + Cos[x + y]) - 0.002 (x + y) ((x - y)^2 - 0.5 (x + y) + Sin[x + y])))/(1 + 0.001 (x + y)^2)^2

    return vec2(f/100., 1.);
}

vec2 custom_copilot(vec2 c){
    c /= 10.;
    float x = c.x;
    float y = c.y;

    float f = (sin(x) - x * cos(x)) * (sin(y) - y * cos(y)) * (sin(x + y) - (x + y) * cos(x + y));

    // dx = (-(y Cos[y]) + Sin[y]) (-(x (x + y) Cos[x + y] Sin[x]) + (-(x (x + y) Cos[x]) + (2 x + y) Sin[x]) Sin[x + y])
    // dy = (-(x Cos[x]) + Sin[x]) (-(y (x + y) Cos[x + y] Sin[y]) + (-(y (x + y) Cos[y]) + (x + 2 y) Sin[y]) Sin[x + y])

    return vec2(f/100., 1.);
}

vec2 shuberts(vec2 c){
    float x = c.x;
    float y = c.y;

    float f1 = 0., f2 = 0.;
    for(float i = 1.; i < 6.; i+=1.){
        f1 += i*cos((i+1.)*x + i);
        f2 += i*cos((i+1.)*y + i);
    }

    return vec2((f1*f2)/200., 1.);
}

vec2 katsuura(vec2 c){
    float x = c.x;
    float y = c.y;
    const float arr2k[32] = float[32](2.,4.,8.,16.,32.,64.,128.,256.,512.,1024.,2048.,4096.,8192.,16384.,32768.,65536.,131072.,262144.,524288.,1048576.,2097152.,4194304.,8388608.,16777216.,33554432.,67108864.,134217728.,268435456.,536870912.,1073741824.,2147483648.,4294967296.);
    const float inv_arr2k[32] = float[32](.5,.25,.125,.0625,.03125,.015625,.0078125,.00390625,.001953125,.0009765625,.00048828125,0.000244140625,0.0001220703125,0.00006103515625,0.000030517578125,0.0000152587890625,0.00000762939453125,0.000003814697265625,0.0000019073486328125,0.00000095367431640625,0.000000476837158203125,0.0000002384185791015625,0.00000011920928955078125,0.000000059604644775390625,0.0000000298023223876953125,0.00000001490116119384765625,0.000000007450580596923828125,0.0000000037252902984619140625,0.00000000186264514923095703125,0.000000000931322574615478515625,0.0000000004656612873077392578125,0.00000000023283064365386962890625);


    float arr_x[32];
    float arr_y[32];
    
    // the original katsuura uses max_a = 32
    // use max_a = 16 or 8 to improve the performance
    int i = 0, max_a = 32; 

    for(i = 0; i < max_a; i++){
        arr_x[i] = x * arr2k[i];
        arr_y[i] = y * arr2k[i];
    }

    for(i = 0; i < max_a; i++){
        arr_x[i] = abs(arr_x[i] - round(arr_x[i]));
        arr_y[i] = abs(arr_y[i] - round(arr_y[i]));
    }

    float dot_x = 0., dot_y = 0.;
    for(i = 0; i < max_a; i++){
        dot_x += arr_x[i] * inv_arr2k[i];
        dot_y += arr_y[i] * inv_arr2k[i];
    }

    float f = -2.5 + 2.5 * pow((dot_x + 1.) * (dot_y * 2. + 1.), 4.3527528164);

    return vec2(f/400., 1.);
    // return 0.;
}

// non derivable function in any point, ray marching doesn't work well
vec2 weierstrass(vec2 c){
    float x = c.x;
    float y = c.y;
    const float inv_arr2k[12] = float[12](1.0,0.5,0.25,0.125,0.0625,0.03125,0.015625,0.0078125,0.00390625,0.001953125,0.0009765625,0.00048828125);
    const float arr3k[12] = float[12](1.,3.,9.,27.,81.,243.,729.,2187.,6561.,19683.,59049.,177147.);

    float x1 = 2 * PI * (x + .5);
    float y1 = 2 * PI * (y + .5);

    float x2 = 0., y2 = 0.;
    for (int i = 0; i < 12; i++){
        x2 += inv_arr2k[i] * cos(x1 * arr3k[i]);
        y2 += inv_arr2k[i] * cos(y1 * arr3k[i]);
    }

    float f = ((x2 + y2) * 0.5 + 1.99951171875);
    f = 10. * f*f*f;

    return vec2(f * 0.0005, 1.);
}

vec2 fun_selection(vec2 c){
    vec2 f = vec2(0.);

    // unfortunately GLSL doesn't support function pointers
    // so we have to use switch statement :<
    switch(fun_select){ 
        case 0 : f = rastrigin(c); break;
        case 1 : f = ackley(c); break;
        case 2 : f = griewank(c); break;
        case 3 : f = rosenbrock(c); break;
        case 4 : f = schwefel(c); break;
        case 5 : f = bukin(c); break;
        case 6 : f = drop_wave(c); break;
        case 7 : f = eggholder(c); break;
        case 8 : f = holder_table(c); break;
        case 9 : f = shaffer(c); break;
        case 10 : f = custom_copilot(c); break;
        case 11 : f = shuberts(c); break;
        case 12 : f = katsuura(c); break;
        case 13 : f = weierstrass(c); break;
        default : f = sphere(c); break;
    }

    return f;
}

void main()
{
    vec2 m = mouse;
    m.x *=-1;
    vec2 uv = (v_uv - 0.5) * aspect_ratio * abs(zoom);
    uv += m * aspect_ratio;

    vec2 _out = fun_selection(uv);

    float f = _out.x * color_range; // function value
    float d = tanh(_out.y * color_range); // derivative

    vec3 col = vec3(0.);

    switch (render_mode) {
        case 0: // only function
            col = cm_viridis(f);
            break;
        case 1: // only derivative 
            col = cm_viridis(d);
            break;
        case 2: // function and derivative
            col = cm_viridis(f) * (vec3(d) + 0.5);
            break;
        case 3: // function and derivative color inverted
            col = cm_viridis(d) * (vec3(f) + 0.5);
            break;
    }

    out_color = vec4(col, 1.0);
}