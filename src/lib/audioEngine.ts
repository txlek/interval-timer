/**
 * Audio engine with iOS/mobile Web Audio API unlock support.
 * Generates default beeps when no custom sound is provided.
 */

import { getAudio, saveAudio, deleteAudio } from "./indexedDb";

const SUPPORTED_FORMATS = [".mp3", ".wav", ".m4a"];

export function isFormatSupported(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  return SUPPORTED_FORMATS.includes(ext);
}

let audioContext: AudioContext | null = null;
let isUnlocked = false;

export function getAudioContext(): AudioContext | null {
  return audioContext;
}

export function isAudioUnlocked(): boolean {
  return isUnlocked;
}

/**
 * Call this on user gesture (click) to unlock Web Audio API on iOS.
 * Must be called before any sounds can play.
 */
export async function unlockAudio(): Promise<boolean> {
  if (isUnlocked && audioContext) {
    return true;
  }

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return false;

    audioContext = new AudioContextClass();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const buffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);

    isUnlocked = true;
    return true;
  } catch {
    return false;
  }
}

function createDefaultBeep(duration: number, freq: number): AudioBuffer | null {
  if (!audioContext) return null;

  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    data[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate) * 0.3 * (1 - i / length);
  }
  return buffer;
}

async function playBuffer(buffer: AudioBuffer, volume = 1): Promise<void> {
  if (!audioContext || !isUnlocked) return;

  const gain = audioContext.createGain();
  gain.gain.value = volume;
  gain.connect(audioContext.destination);

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(gain);
  source.start(0);
}

async function playBlob(blob: Blob, volume = 1): Promise<void> {
  if (!audioContext || !isUnlocked) return;

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const gain = audioContext.createGain();
    gain.gain.value = volume;
    gain.connect(audioContext.destination);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gain);
    source.start(0);
  } catch {
    const beep = createDefaultBeep(0.15, 880);
    if (beep) await playBuffer(beep, volume);
  }
}

export async function playIntervalSound(volume = 1): Promise<void> {
  const custom = await getAudio("interval");
  if (custom) {
    await playBlob(custom, volume);
  } else {
    const beep = createDefaultBeep(0.15, 880);
    if (beep) await playBuffer(beep, volume);
  }
}

export async function playFinishSound(volume = 1): Promise<void> {
  const custom = await getAudio("finish");
  if (custom) {
    await playBlob(custom, volume);
  } else {
    const beep = createDefaultBeep(0.4, 660);
    if (beep) await playBuffer(beep, volume);
  }
}

export async function saveIntervalSound(blob: Blob): Promise<void> {
  await saveAudio("interval", blob);
}

export async function saveFinishSound(blob: Blob): Promise<void> {
  await saveAudio("finish", blob);
}

export async function resetIntervalSound(): Promise<void> {
  await deleteAudio("interval");
}

export async function resetFinishSound(): Promise<void> {
  await deleteAudio("finish");
}

export async function hasCustomIntervalSound(): Promise<boolean> {
  const a = await getAudio("interval");
  return a !== null;
}

export async function hasCustomFinishSound(): Promise<boolean> {
  const a = await getAudio("finish");
  return a !== null;
}
