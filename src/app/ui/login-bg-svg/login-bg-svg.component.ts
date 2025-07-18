import { Component } from '@angular/core';

@Component({
  selector: 'app-login-bg-svg',
  standalone: true,
  template: `
    <svg
      class="absolute inset-0 w-full h-full pointer-events-none z-0"
      viewBox="0 0 1440 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <path
        opacity="0.7"
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M272.5 1320.67C519.647 1320.67 720 1128.93 720 892.411C720 765.967 401.153 870.798 310.095 792.404C230.823 724.156 387.523 464.149 272.5 464.149C25.3526 464.149 -175 655.889 -175 892.411C-175 1128.93 25.3526 1320.67 272.5 1320.67Z"
        fill="#392A4B"
        class="path-1"
      />
      <path
        opacity="0.7"
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M864.471 -199.934C814.505 71.253 1003.72 329.857 1287.08 377.675C1438.57 403.238 1377.44 32.1841 1489.77 -51.8818C1587.56 -125.067 1867.39 99.44 1890.64 -26.7711C1940.61 -297.958 1751.4 -556.562 1468.03 -604.379C1184.66 -652.197 914.436 -471.12 864.471 -199.934Z"
        fill="#392A4B"
        class="path-2"
      />
      <path
        opacity="0.7"
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M219.512 -223.889C-12.7302 -142.993 -132.475 102.762 -47.946 325.02C-2.75682 443.839 259.396 240.966 372.979 284.828C471.861 323.012 417.534 618.629 525.62 580.98C757.863 500.085 877.608 254.33 793.079 32.0717C708.55 -190.187 451.755 -304.784 219.512 -223.889Z"
        fill="#392A4B"
        class="path-3"
      />
      <path
        opacity="0.7"
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M2006.38 987.595C2061.52 688.301 1852.7 402.893 1539.96 350.119C1372.77 321.907 1440.24 731.419 1316.27 824.198C1208.34 904.969 899.512 657.192 873.848 796.485C818.703 1095.78 1027.53 1381.19 1340.26 1433.96C1653 1486.73 1951.23 1286.89 2006.38 987.595Z"
        fill="#392A4B"
        class="path-4"
      />
    </svg>
  `,
  styles: [
    `
      .path-1,
      .path-2,
      .path-3,
      .path-4 {
        transform-origin: center;
        animation: svgPulse 5s ease-in-out infinite;
        opacity: 0.7;
      }
      .path-2 {
        animation-delay: 1s;
      }
      .path-3 {
        animation-delay: 2s;
      }
      .path-4 {
        animation-delay: 3s;
      }
      @keyframes svgPulse {
        0% {
          transform: scale(1) translateY(0);
        }
        40% {
          transform: scale(1.03) translateY(-10px);
        }
        60% {
          transform: scale(1.03) translateY(-10px);
        }
        100% {
          transform: scale(1) translateY(0);
        }
      }
    `,
  ],
})
export class LoginBgSvgComponent {}
