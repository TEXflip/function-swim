#version 430
uniform float T;
uniform float aspect_ratio;
uniform vec2 mouse;
uniform float zoom;

// in vec2 v_uv: screen space coordniate
in vec2 v_uv;
// out color
out vec4 out_color;
const float pi = 3.1415926535;

vec3 cm_viridis(float t) {

    const vec3 c0 = vec3(0.2777273272234177, 0.005407344544966578, 0.3340998053353061);
    const vec3 c1 = vec3(0.1050930431085774, 1.404613529898575, 1.384590162594685);
    const vec3 c2 = vec3(-0.3308618287255563, 0.214847559468213, 0.09509516302823659);
    const vec3 c3 = vec3(-4.634230498983486, -5.799100973351585, -19.33244095627987);
    const vec3 c4 = vec3(6.228269936347081, 14.17993336680509, 56.69055260068105);
    const vec3 c5 = vec3(4.776384997670288, -13.74514537774601, -65.35303263337234);
    const vec3 c6 = vec3(-5.435455855934631, 4.645852612178535, 26.3124352495832);

    if (t > 1.0)
        return vec3(1.);

    return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));

}

vec3 cm_magma(float t) {

    const vec3 c0 = vec3(-0.002136485053939582, -0.000749655052795221, -0.005386127855323933);
    const vec3 c1 = vec3(0.2516605407371642, 0.6775232436837668, 2.494026599312351);
    const vec3 c2 = vec3(8.353717279216625, -3.577719514958484, 0.3144679030132573);
    const vec3 c3 = vec3(-27.66873308576866, 14.26473078096533, -13.64921318813922);
    const vec3 c4 = vec3(52.17613981234068, -27.94360607168351, 12.94416944238394);
    const vec3 c5 = vec3(-50.76852536473588, 29.04658282127291, 4.23415299384598);
    const vec3 c6 = vec3(18.65570506591883, -11.48977351997711, -5.601961508734096);

    return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
}

float rastrigin(vec2 c){
    float x = c.x;
    float y = c.y;

    x = x*x - 10 * cos(2 * pi * x) + 10;
    y = y*y - 10 * cos(2 * pi * y) + 10;

    return (x + y - 20.91)/100.;
}

void main()
{
    vec2 m = mouse;
    vec2 uv = (v_uv - 0.5) * zoom;
    uv.x *= aspect_ratio;

    vec3 col = cm_viridis(rastrigin(uv));

    out_color = vec4(col, 1.0);
}