precision mediump float;

varying vec2       vTextureCoord;
varying vec4       vColor;
uniform sampler2D  uSampler;
uniform float      edge0;
uniform float      edge1;

void main(void) {
    gl_FragColor = texture2D(uSampler, vTextureCoord);
    float whiteness = ( gl_FragColor.r + gl_FragColor.b + gl_FragColor.g ) / 3.0;
    float redness = ( (1.0-gl_FragColor.b) + (1.0-gl_FragColor.g) ) / 2.0;
    float step = smoothstep(edge0, edge1, whiteness - redness*redness);
    gl_FragColor = mix( gl_FragColor, vec4(0.0), step );
}