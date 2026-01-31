let writer: WritableStreamDefaultWriter | null = null;

export async function connectArduino() {
  const nav = navigator as any;

  if (!nav.serial) {
    alert("Web Serial API not supported. Use Chrome or Edge.");
    return;
  }

  const port = await nav.serial.requestPort();
  await port.open({ baudRate: 9600 });

  writer = port.writable.getWriter();
}

export function sendToArduino(az: number, el: number) {
  if (!writer) return;

  const msg = `${Math.round(az)} ${Math.round(el)}\n`;
  writer.write(new TextEncoder().encode(msg));
}
