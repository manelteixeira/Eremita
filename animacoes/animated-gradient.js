const canvas = document.getElementById("animated-gradient");

if (!canvas) {
  console.warn("Canvas do Animated Gradient não encontrado.");
} else {
  const gl = canvas.getContext("webgl2");

  if (!gl) {
    console.warn("WebGL2 não é suportado neste navegador.");
  } else {
    iniciarAnimatedGradient(gl, canvas);
  }
}

function iniciarAnimatedGradient(gl, canvas) {
  const vertexShaderSource = `#version 300 es

    in vec4 a_position;

    void main() {
      gl_Position = a_position;
    }
  `;

  const fragmentShaderSource = `#version 300 es

    precision highp float;

    uniform float u_time;
    uniform vec2 u_resolution;

    out vec4 fragColor;

    #define TWO_PI 6.28318530718

    vec2 rotate(vec2 uv, float angle) {
      float c = cos(angle);
      float s = sin(angle);

      return mat2(c, s, -s, c) * uv;
    }

    float random(vec2 st) {
      return fract(
        sin(dot(st.xy, vec2(12.9898, 78.233)))
        * 43758.5453123
      );
    }

    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);

      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));

      vec2 u = f * f * (3.0 - 2.0 * f);

      float x1 = mix(a, b, u.x);
      float x2 = mix(c, d, u.x);

      return mix(x1, x2, u.y);
    }

    void main() {

      vec2 uv = gl_FragCoord.xy / u_resolution.xy;

      uv -= 0.5;

      float proporcao = u_resolution.x / u_resolution.y;

      uv.x *= proporcao;

      float tempo = u_time * 0.15;

      float n1 = noise(uv * 2.0 + tempo);
      float n2 = noise(uv * 3.0 - tempo);

      float angulo = n1 * TWO_PI;

      uv.x += 0.35 * n2 * cos(angulo);
      uv.y += 0.35 * n2 * sin(angulo);

      uv = rotate(uv, -0.4);

      float mistura = 0.5 + uv.x * 0.8 + n1 * 0.35;

      mistura = clamp(mistura, 0.0, 1.0);

      vec3 verde = vec3(0.086, 0.639, 0.290);
      vec3 azul = vec3(0.145, 0.388, 0.922);
      vec3 escuro = vec3(0.02, 0.08, 0.06);

      vec3 cor;

      if (mistura < 0.5) {

        float t = mistura * 2.0;

        cor = mix(escuro, verde, t);

      } else {

        float t = (mistura - 0.5) * 2.0;

        cor = mix(verde, azul, t);
      }

      fragColor = vec4(cor, 1.0);
    }
  `;

  function criarShader(tipo, codigo) {
    const shader = gl.createShader(tipo);

    gl.shaderSource(shader, codigo);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Erro ao compilar shader:", gl.getShaderInfoLog(shader));

      gl.deleteShader(shader);

      return null;
    }

    return shader;
  }

  const vertexShader = criarShader(gl.VERTEX_SHADER, vertexShaderSource);

  const fragmentShader = criarShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

  if (vertexShader && fragmentShader) {
    const programa = gl.createProgram();

    gl.attachShader(programa, vertexShader);
    gl.attachShader(programa, fragmentShader);

    gl.linkProgram(programa);

    if (gl.getProgramParameter(programa, gl.LINK_STATUS)) {
      gl.useProgram(programa);

      const vertices = new Float32Array([
        -1, -1, 1, -1, -1, 1,

        -1, 1, 1, -1, 1, 1,
      ]);

      const buffer = gl.createBuffer();

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const posicao = gl.getAttribLocation(programa, "a_position");

      gl.enableVertexAttribArray(posicao);

      gl.vertexAttribPointer(posicao, 2, gl.FLOAT, false, 0, 0);

      const tempoUniforme = gl.getUniformLocation(programa, "u_time");

      const resolucaoUniforme = gl.getUniformLocation(programa, "u_resolution");

      function ajustarCanvas() {
        const largura = canvas.clientWidth;
        const altura = canvas.clientHeight;

        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = largura * pixelRatio;
        canvas.height = altura * pixelRatio;

        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      window.addEventListener("resize", ajustarCanvas);

      ajustarCanvas();

      const inicio = performance.now();

      function animar(agora) {
        const tempo = (agora - inicio) / 1000;

        gl.useProgram(programa);

        gl.uniform1f(tempoUniforme, tempo);

        gl.uniform2f(resolucaoUniforme, canvas.width, canvas.height);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(animar);
      }

      requestAnimationFrame(animar);
    } else {
      console.error(
        "Erro ao criar programa WebGL:",
        gl.getProgramInfoLog(programa),
      );
    }
  }
}
