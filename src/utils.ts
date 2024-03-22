export function getContrastColor (): string {
  let bodyBackgroundColor = window.getComputedStyle(document.body).background

  // Remove whitespace and convert to lowercase
  bodyBackgroundColor = bodyBackgroundColor.replace(/\s/g, '').toLowerCase()

  const rgbToHex = (r: number, g: number, b: number): string =>
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16)
        return hex.length === 1 ? `0${hex}` : hex
      })
      .join('')

  let hex
  if (bodyBackgroundColor.charAt(0) === '#') {
    hex = bodyBackgroundColor
  } else if (bodyBackgroundColor.substring(0, 3) === 'rgb') {
    const rgb = bodyBackgroundColor
      .substring(4, bodyBackgroundColor.length - 1)
      .replace(/ /g, '')
      .split(',')
      .map((x) => parseInt(x))
    hex = rgbToHex(rgb[0], rgb[1], rgb[2])
  } else {
    throw new Error('Invalid color')
  }

  return invertColor(hex)
}

export function invertColor (hex: string): string {
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1)
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }
  if (hex.length !== 6) {
    throw new Error(`Invalid HEX color. ${hex}`)
  }
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '#000000' : '#FFFFFF'
}

export async function until (conditionFunction: () => boolean): Promise<any> {
  const poll = (resolve: any): void => {
    if (conditionFunction()) resolve()
    else setTimeout(() => poll(resolve), 100)
  }

  return await new Promise(poll)
}

export function decimalToRGB (decimalColor: number): {
  red: number
  green: number
  blue: number
} {
  // Convert decimal to RGB
  const red = (decimalColor >> 16) & 255
  const green = (decimalColor >> 8) & 255
  const blue = decimalColor & 255

  // Return RGB object
  return { red, green, blue }
}

export async function audioUrlToDataUrl (audioUrl: string): Promise<string> {
  const response = await fetch(audioUrl)

  console.log(response)

  const reader = response.body?.getReader()
  const chunks: string[] = []

  console.group('Loading...')
  let i = 0
  while (true) {
    const { done, value } = await reader?.read() as never
    if (done) break
    chunks.push(value)
    console.log(`chunk ${i}`)
    i++
  }
  console.groupEnd()
  const blob = new Blob(chunks, {
    type: response.headers.get('Content-Type') as string | undefined
  })
  const base64data: string = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(blob)
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
  })

  return base64data
}
