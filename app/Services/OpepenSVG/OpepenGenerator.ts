import sharp from 'sharp'
import { randomBetween } from 'App/Helpers/random'

type ShapeForm = 'rounded' | 'square'

export type OpepenOptions = {
  bg?: string
  fill?: string
  stroke?: {
    width?: number
    color?: string
  }
  noise?: boolean
  blur?: boolean

  // TODO: Make these more dynamic with fill colors etc.
  leftEye?: number
  rightEye?: number
  mouth?: {
    form?: ShapeForm
    variation?: number
  }
  torso?: {
    form?: ShapeForm
    variation?: number
  }
}

export const generateOpepenConfig = (options: OpepenOptions): OpepenOptions => {
  const bg = options.bg || (Math.random() > 0.5 ? '#fff' : '#ddd')

  const fillRandomizer = Math.random()
  const fill =
    options.fill ||
    (fillRandomizer < 0.3 ? 'transparent' : fillRandomizer > 0.7 ? 'black' : '#696969')

  const stroke = options.stroke || {
    width:
      Math.random() > 0.5 || fill === 'transparent'
        ? Math.random() > 0.5
          ? randomBetween(1, 3)
          : randomBetween(1, 20)
        : 0,
    color: 'black',
  }

  const leftEye = options.leftEye || randomBetween(1, 5)
  const rightEye = options.rightEye || randomBetween(1, 5)
  const mouth = options.mouth || {
    form: Math.random() > 0.5 ? 'square' : 'rounded',
    variation: randomBetween(1, 5),
  }
  const torso = options.torso || {
    form: Math.random() > 0.5 ? 'square' : 'rounded',
    variation: randomBetween(0, 4),
  }

  const blur = typeof options.blur === 'boolean' ? options.blur : Math.random() > 0.6
  const noise = typeof options.noise === 'boolean' ? options.noise : Math.random() > 0.8

  return {
    ...options,
    bg,
    stroke,
    fill,
    leftEye,
    rightEye,
    mouth,
    torso,
    noise,
    blur,
  }
}

export const generateOpepenSVG = (options: OpepenOptions) => {
  const strokeWidth = typeof options.stroke?.width === 'number' ? options.stroke?.width : 1

  return `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="512" height="512" fill="${options.bg || `#ddd`}" />

      ${options.noise ? `<rect width="512" height="512" filter="url(#noise)" />` : ``}

      <!-- Opepen -->
      <g
        fill="${options.fill || `#111`}"
        stroke="${options.stroke?.color || `#111`}"
        stroke-width="${strokeWidth}"
        ${options.blur ? `filter="url(#blur)"` : ``}
        transform="translate(0, -${strokeWidth / 2})"
      >
        <!-- Left Eye -->
        <g transform="translate(128, 128)" id="left-eye">
          <use href="#left-eye-${options.leftEye || 1}" />
        </g>

        <!-- Right Eye -->
        <g transform="translate(256, 128)" id="right-eye">
          <use href="#right-eye-${options.rightEye || 1}" />
        </g>


        <!-- Mouth -->
        <g transform="translate(128, 256)">
          <use href="#mouth-${options.mouth?.form || `rounded`}-${options.mouth?.variation || 1}" />
          </g>

          <!-- Torso -->
          ${
            options.torso
              ? `
              <g transform="translate(128, 448)">
                <use href="#torso-${options.torso?.form || `rounded`}-${options.torso?.variation || 1}" />

                <use id="body-extension" x="0" y="64" href="#4x1" />
              </g>
            `
              : ``
          }
      </g>

      <defs>
          <!-- ====================================================== -->
          <!-- BODY PARTS -->
          <!-- ====================================================== -->

          <!-- LEFT EYE -->
          <g id="left-eye-1">
            <use href="#2x2_tr-br-bl" />
          </g>
          <g id="left-eye-2">
            <use href="#1x1" />
            <use x="64" href="#1x1_tr" />
            <use x="64" y="64" href="#1x1_br" />
          </g>
          <g id="left-eye-3">
            <use href="#2x2_tr-br-bl_bl" />
          </g>
          <g id="left-eye-4">
            <use href="#1x1" />
            <use x="64" href="#1x2_tr-br" />
          </g>
          <g id="left-eye-5">
            <use href="#2x1_tr" />
            <use x="64" y="64" href="#1x1_br" />
          </g>


          <!-- RIGHT EYE -->
          <g id="right-eye-1">
            <use href="#1x1_tl" />
            <use x="64" href="#1x1_tr" />
            <use x="64" y="64" href="#1x1_br" />
          </g>
          <g id="right-eye-2">
            <use href="#1x1_tl" />
            <use x="64" href="#1x1_tr" />
            <use y="64" href="#1x1_bl" />
            <use x="64" y="64" href="#1x1_br" />
          </g>
          <g id="right-eye-3">
            <use href="#1x2_tl-bl" />
            <use x="64" href="#1x2_tr-br" />
          </g>
          <g id="right-eye-4">
            <use href="#1x1_tl" />
            <use y="64" href="#1x1_bl" />
            <use x="64" href="#1x2_tr-br" />
          </g>
          <g id="right-eye-5">
            <use href="#2x1_tl-tr" />
            <use y="64" href="#1x1_bl" />
            <use x="64" y="64" href="#1x1_br" />
          </g>


          <!-- MOUTH -->
          <g id="mouth-rounded-1">
            <use href="#4x2_bl-br" />
          </g>
          <g id="mouth-rounded-2">
            <use href="#4x1" />
            <use y="64" href="#4x1_bl-br" />
          </g>
          <g id="mouth-rounded-3">
            <use href="#2x1" />
            <use x="128" href="#2x1" />
            <use y="64" href="#4x1_bl-br" />
          </g>
          <g id="mouth-rounded-4">
            <use href="#1x1" />
            <use x="64" href="#2x1" />
            <use x="192" href="#1x1" />
            <use y="64" href="#4x1_bl-br" />
          </g>
          <g id="mouth-rounded-5">
            <use href="#1x1" />
            <use x="64" href="#1x1" />
            <use x="128" href="#1x1" />
            <use x="192" href="#1x1" />
            <use y="64" href="#4x1_bl-br" />
          </g>

          <g id="mouth-square-1">
            <use href="#4x2" />
          </g>
          <g id="mouth-square-2">
            <use href="#1x1" />
            <use x="64" href="#1x1" />
            <use x="128" href="#1x1" />
            <use x="192" href="#1x1" />
            <use y="64" href="#1x1" />
            <use x="64" y="64" href="#1x1" />
            <use x="128" y="64" href="#1x1" />
            <use x="192" y="64" href="#1x1" />
          </g>
          <g id="mouth-square-3">
            <use href="#1x2" />
            <use x="64" href="#1x2" />
            <use x="128" href="#1x2" />
            <use x="192" href="#1x2" />
          </g>
          <g id="mouth-square-4">
            <use href="#4x1" />
            <use y="64" href="#4x1" />
          </g>
          <g id="mouth-square-5">
            <use href="#4x1" />
            <use y="64" href="#4x1" />
          </g>


          <!-- TORSO -->
          <g id="torso-rounded-1">
            <use href="#4x1_tl-tr" />
          </g>
          <g id="torso-rounded-2">
            <use href="#2x1_tl" />
            <use x="128" href="#2x1_tr" />
          </g>
          <g id="torso-rounded-3">
            <use href="#1x1_tl" />
            <use x="64" href="#2x1" />
            <use x="192" href="#1x1_tr" />
          </g>
          <g id="torso-rounded-4">
            <use href="#1x1_tl" />
            <use x="64" href="#1x1" />
            <use x="128" href="#1x1" />
            <use x="192" href="#1x1_tr" />
          </g>

          <g id="torso-square-1">
            <use href="#4x1" />
          </g>
          <g id="torso-square-2">
            <use href="#2x1" />
            <use x="128" href="#2x1" />
          </g>
          <g id="torso-square-3">
            <use href="#2x1" />
            <use x="128" href="#1x1" />
            <use x="192" href="#1x1" />
          </g>
          <g id="torso-square-4">
            <use href="#1x1" />
            <use x="64" href="#1x1" />
            <use x="128" href="#1x1" />
            <use x="192" href="#1x1" />
          </g>

          <!-- ====================================================== -->
          <!-- BASE SHAPES -->
          <!-- ====================================================== -->
          <rect id="1x1" width="64" height="64" />
          <rect id="1x2" width="64" height="128" />
          <rect id="2x1" width="128" height="64" />
          <rect id="4x1" width="256" height="64" />
          <rect id="4x2" width="256" height="128" />
          <path id="1x1_tl" d="M 64 0
            A 64 64, 0, 0, 0, 0 64
            L 64 64 Z"
          />
          <path id="1x1_tr" d="M 0 0
            A 64 64, 0, 0, 1, 64 64
            L 0 64 Z"
          />
          <path id="1x1_bl" d="M 0 0
            A 64 64, 0, 0, 0, 64 64
            L 64 0 Z"
          />
          <path id="1x1_br" d="M 64 0
            A 64 64, 0, 0, 1, 0 64
            L 0 0 Z"
          />
          <path id="1x2_tl-bl" d="M 64 0
            A 64 64, 0, 0, 0, 64 128 Z"
          />
          <path id="1x2_tr-br" d="M 0 0
            A 64 64, 0, 0, 1, 0 128 Z"
          />
          <path id="2x1_tl" d="M 0 64
            A 64 64, 0, 0, 1, 64 0
            L 128 0
            L 128 64 Z"
          />
          <path id="2x1_tr" d="M 0 0
            L 64 0
            A 64 64, 0, 0, 1, 128 64
            L 0 64 Z"
          />
          <path id="2x1_tl-tr" d="M 0 64
            A 64 64, 0, 0, 1, 128 64
            L 0 64 Z"
          />
          <path id="2x2_tr-br-bl" d="M 64 0
            A 64 64, 0, 1, 1, 0 64
            L 0 0 Z"
          />
          <path id="2x2_tr-br-bl_bl" d="M 0 0
            L 64 0
            A 64 64, 0, 0, 1, 64 128
            L 64 64
            L 0 64 Z"
          />
          <path id="4x1_tl-tr" d="M 0 64
            A 64 64, 0, 0, 1, 64 0
            L 192 0
            A 64 64, 0, 0, 1, 256 64
            Z"
          />
          <path id="4x1_bl-br" d="M 64 64
            A 64 64, 0, 0, 1, 0 0
            L 256 0
            A 64 64, 0, 0, 1, 192 64
            Z"
          />
          <path id="4x2_bl-br" d="M 64 128
            A 64 64, 0, 0, 1, 0 64
            L 0 0
            L 256 0
            L 256 64
            A 64 64, 0, 0, 1, 192 128
            Z"
          />

          <!-- EFFECTS -->
          <filter id="blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.25" />
          </filter>

          <filter id="noise" x="-20%" y="-20%" width="140%" height="140%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="linearRGB">
            <feTurbulence type="turbulence" baseFrequency="0.2" numOctaves="4" seed="80" stitchTiles="stitch" result="turbulence"></feTurbulence>
            <feSpecularLighting surfaceScale="5" specularConstant="10" specularExponent="20" lighting-color="#FAFAFA" in="turbulence" result="specularLighting">
              <feDistantLight elevation="100"></feDistantLight>
            </feSpecularLighting>
          </filter>
      </defs>
    </svg>`
}

export const generateOpepenPNG = (options: OpepenOptions) => {
  return sharp(Buffer.from(generateOpepenSVG(options)))
    .toFormat('png')
    .toBuffer()
}
