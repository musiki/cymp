import {
  ConnectionState,
  DataPacket_Kind,
  Room,
  RoomEvent,
  RemoteTrackPublication,
  Track,
  type LocalParticipant,
  type RemoteParticipant,
  type TrackPublication,
} from 'livekit-client';

import { subscribeToLive } from '../lib/live/client.mjs';
import { formatCountdown, getRemainingMs } from '../lib/live/countdown.mjs';
import { normalizeLayoutMode, setLayout, type LayoutMode } from './layout-controller';
import { createPresentationController } from './presentation';

type Participant = LocalParticipant | RemoteParticipant;
type ParticipantRole = 'teacher' | 'student';
type SlideState = {
  indexf: number;
  indexh: number;
  indexv: number;
  zoom: number;
};

type ConferenceMessage =
  | {
      type: 'layout';
      layout: LayoutMode;
    }
  | {
      type: 'session-setup';
      previewZoom: number;
      showCircle: boolean;
    }
  | {
      id: string;
      identity: string;
      name: string;
      role: ParticipantRole;
      sentAt: string;
      text: string;
      type: 'chat';
    }
  | {
      type: 'presentation';
      href: string | null;
    }
  | ({
      type: 'slide-state';
    } & SlideState);

type LiveSnapshot = {
  active?: boolean;
  courseId?: string;
  pageSlug?: string;
  sessionId?: string;
  interactionId?: string;
  endsAt?: string | null;
  prompt?: string;
  type?: string;
    };

type ParticipantCardRefs = {
  card: HTMLElement;
  hand: HTMLElement;
  media: HTMLElement;
  name: HTMLElement;
  placeholder: HTMLElement;
};

type ScreenCardRefs = {
  card: HTMLElement;
  media: HTMLElement;
  name: HTMLElement;
};

type MediaMount = {
  attached?: boolean;
  element: HTMLMediaElement;
  track: Track;
  trackSid: string;
};

type ParticipantMount = MediaMount & {
  wrapper: HTMLElement;
};

type LocalPreviewStreamMount = {
  deviceId: string;
  element: HTMLVideoElement;
  stream: MediaStream;
  wrapper: HTMLElement;
};

type WebkitDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
};

type WebkitFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type MountCollection = {
  participantAudioMounts: Map<string, MediaMount>;
  participantVideoMounts: Map<string, ParticipantMount>;
  screenAudioMounts: Map<string, MediaMount>;
  screenVideoMounts: Map<string, ParticipantMount>;
};

type PersistedRoomSetup = {
  handTrackEnabled?: boolean;
  identity?: string;
  instrumentsOpen?: boolean;
  name?: string;
  preferredAudioInputId?: string;
  preferredVideoInputId?: string;
  previewBlur?: boolean;
  previewZoom?: number;
  showCircle?: boolean;
  synthMasterGain?: number;
  room?: string;
};

type VideoTrackProcessorLike = {
  destroy: () => Promise<void>;
  init: (opts: {
    element?: HTMLMediaElement;
    kind: Track.Kind.Video;
    track: MediaStreamTrack;
  }) => Promise<void>;
  name: string;
  processedTrack?: MediaStreamTrack;
  restart: (opts: {
    element?: HTMLMediaElement;
    kind: Track.Kind.Video;
    track: MediaStreamTrack;
  }) => Promise<void>;
};

type LocalCameraTrackLike = {
  getProcessor?: () => { name?: string } | undefined;
  kind: Track.Kind.Video;
  setProcessor?: (
    processor: VideoTrackProcessorLike,
    showProcessedStreamLocally?: boolean,
  ) => Promise<void>;
  stopProcessor?: (keepElement?: boolean) => Promise<void>;
};

type VisionTasksModule = typeof import('@mediapipe/tasks-vision');
type VisionMask = import('@mediapipe/tasks-vision').MPMask;
type VisionHandLandmarker = InstanceType<VisionTasksModule['HandLandmarker']>;
type HandLandmarkPoint = {
  x: number;
  y: number;
  z: number;
};
type HandSynthTelemetry = {
  carrier: number;
  cutoff: number;
  gain: number;
  modulator: number;
  resonance: number;
};

const MESSAGE_TOPIC = 'conference-ui';
const ROOM_SETUP_STORAGE_KEY = 'musiki:room:setup:v1';
const BACKGROUND_BLUR_PROCESSOR_NAME = 'musiki-background-blur';
const BACKGROUND_BLUR_MODEL_ASSET =
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter_landscape/float16/latest/selfie_segmenter_landscape.tflite';
const HAND_LANDMARKER_MODEL_ASSET =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const BACKGROUND_BLUR_WASM_BASE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm';
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
let visionTasksModulePromise: Promise<VisionTasksModule> | null = null;
let visionTasksFilesetPromise: Promise<unknown> | null = null;

const loadVisionTasksModule = () => {
  if (!visionTasksModulePromise) {
    visionTasksModulePromise = import('@mediapipe/tasks-vision');
  }
  return visionTasksModulePromise;
};

const loadVisionTasksFileset = async () => {
  if (!visionTasksFilesetPromise) {
    const vision = await loadVisionTasksModule();
    visionTasksFilesetPromise = vision.FilesetResolver.forVisionTasks(BACKGROUND_BLUR_WASM_BASE);
  }
  return visionTasksFilesetPromise;
};

const normalizeText = (value: unknown) => String(value ?? '').trim();
const formatRoleLabel = (role: ParticipantRole) => (role === 'teacher' ? 'Teacher' : 'Student');
const normalizePreviewZoom = (value: unknown, fallback = 1) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(4, Math.max(0.8, Math.round(parsed * 100) / 100));
};

const normalizeUnitValue = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1, Math.max(0, Math.round(parsed * 100) / 100));
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (start: number, end: number, amount: number) => start + (end - start) * amount;
const roundTo = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const normalizeMasterGain = (value: unknown, fallback = 0.35) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1, Math.max(0, Math.round(parsed * 100) / 100));
};

class FMSynthVoice {
  private context: AudioContext | null = null;
  private carrierOscillator: OscillatorNode | null = null;
  private dynamicGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private masterGainNode: GainNode | null = null;
  private modulatorDepth: GainNode | null = null;
  private modulatorOscillator: OscillatorNode | null = null;
  private ready = false;
  private masterGain = 0.35;

  private getAudioContextCtor() {
    return (
      window.AudioContext ||
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext ||
      null
    );
  }

  async ensureReady() {
    if (this.ready && this.context) {
      if (this.context.state !== 'running') {
        await this.context.resume().catch(() => undefined);
      }
      return;
    }

    const AudioContextCtor = this.getAudioContextCtor();
    if (!AudioContextCtor) {
      throw new Error('Web Audio is not available in this browser.');
    }

    const context = new AudioContextCtor({ sampleRate: 48_000 });
    this.context = context;

    const carrierOscillator = context.createOscillator();
    carrierOscillator.type = 'sine';
    carrierOscillator.frequency.value = 220;

    const modulatorOscillator = context.createOscillator();
    modulatorOscillator.type = 'sine';
    modulatorOscillator.frequency.value = 220;

    const modulatorDepth = context.createGain();
    modulatorDepth.gain.value = 45;

    const filterNode = context.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 800;
    filterNode.Q.value = 1;

    const dynamicGain = context.createGain();
    dynamicGain.gain.value = 0;

    const masterGainNode = context.createGain();
    masterGainNode.gain.value = this.masterGain;

    modulatorOscillator.connect(modulatorDepth);
    modulatorDepth.connect(carrierOscillator.frequency);
    carrierOscillator.connect(filterNode);
    filterNode.connect(dynamicGain);
    dynamicGain.connect(masterGainNode);
    masterGainNode.connect(context.destination);

    carrierOscillator.start();
    modulatorOscillator.start();

    this.carrierOscillator = carrierOscillator;
    this.modulatorOscillator = modulatorOscillator;
    this.modulatorDepth = modulatorDepth;
    this.filterNode = filterNode;
    this.dynamicGain = dynamicGain;
    this.masterGainNode = masterGainNode;
    this.ready = true;

    if (context.state !== 'running') {
      await context.resume().catch(() => undefined);
    }
  }

  setMasterGain(value: number) {
    this.masterGain = normalizeMasterGain(value, this.masterGain);
    if (this.masterGainNode && this.context) {
      this.masterGainNode.gain.setTargetAtTime(this.masterGain, this.context.currentTime, 0.03);
    }
  }

  clearHand() {
    if (!this.dynamicGain || !this.context) return;
    this.dynamicGain.gain.setTargetAtTime(0, this.context.currentTime, 0.04);
  }

  update(telemetry: HandSynthTelemetry) {
    if (
      !this.context ||
      !this.carrierOscillator ||
      !this.modulatorOscillator ||
      !this.modulatorDepth ||
      !this.filterNode ||
      !this.dynamicGain
    ) {
      return;
    }

    const now = this.context.currentTime;
    const carrier = Math.max(60, telemetry.carrier);
    const modulatorRatio = Math.max(0.25, telemetry.modulator);
    const filterCutoff = Math.max(80, telemetry.cutoff);
    const resonance = Math.max(0.5, telemetry.resonance);
    const gain = clamp01(telemetry.gain);
    const modulationDepth = carrier * (0.12 + modulatorRatio * 0.38);

    this.carrierOscillator.frequency.setTargetAtTime(carrier, now, 0.03);
    this.modulatorOscillator.frequency.setTargetAtTime(carrier * modulatorRatio, now, 0.03);
    this.modulatorDepth.gain.setTargetAtTime(modulationDepth, now, 0.03);
    this.filterNode.frequency.setTargetAtTime(filterCutoff, now, 0.04);
    this.filterNode.Q.setTargetAtTime(resonance, now, 0.04);
    this.dynamicGain.gain.setTargetAtTime(gain * 0.32, now, 0.03);
  }

  async destroy() {
    if (this.carrierOscillator) {
      this.carrierOscillator.stop();
      this.carrierOscillator.disconnect();
      this.carrierOscillator = null;
    }
    if (this.modulatorOscillator) {
      this.modulatorOscillator.stop();
      this.modulatorOscillator.disconnect();
      this.modulatorOscillator = null;
    }
    this.modulatorDepth?.disconnect();
    this.modulatorDepth = null;
    this.filterNode?.disconnect();
    this.filterNode = null;
    this.dynamicGain?.disconnect();
    this.dynamicGain = null;
    this.masterGainNode?.disconnect();
    this.masterGainNode = null;
    this.ready = false;

    if (this.context && this.context.state !== 'closed') {
      await this.context.close().catch(() => undefined);
    }
    this.context = null;
  }
}

const readPersistedRoomSetup = (): PersistedRoomSetup => {
  try {
    const raw = window.localStorage.getItem(ROOM_SETUP_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as PersistedRoomSetup) : {};
  } catch {
    return {};
  }
};

const writePersistedRoomSetup = (nextSetup: PersistedRoomSetup) => {
  try {
    window.localStorage.setItem(ROOM_SETUP_STORAGE_KEY, JSON.stringify(nextSetup));
  } catch {
    // ignore storage failures
  }
};

const readParticipantMetadata = (participant: Participant) => {
  try {
    const parsed = JSON.parse(participant.metadata || '{}');
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
};

const isTeacherRole = (value: unknown): value is ParticipantRole =>
  normalizeText(value).toLowerCase() === 'teacher';

const normalizeRole = (value: unknown): ParticipantRole =>
  isTeacherRole(normalizeText(value).toLowerCase()) ? 'teacher' : 'student';

const readParticipantRole = (
  room: Room,
  participant: Participant,
  localRole: ParticipantRole,
): ParticipantRole => {
  if (isLocalParticipant(room, participant)) {
    return localRole;
  }

  const parsed = readParticipantMetadata(participant);
  const role = normalizeText(parsed?.role);
  return role
    ? normalizeRole(role)
    : participant.identity.toLowerCase().startsWith('teacher')
      ? 'teacher'
      : 'student';
};

const readParticipantName = (participant: Participant) =>
  normalizeText(participant.name) || normalizeText(participant.identity) || 'Participant';

const readParticipantHandRaisedFromMetadata = (participant: Participant) =>
  Boolean(readParticipantMetadata(participant).handRaised);

const readParticipantPreviewZoom = (participant: Participant) =>
  normalizePreviewZoom(readParticipantMetadata(participant).previewZoom, 1);

const readParticipantShowCircle = (participant: Participant) => {
  const value = readParticipantMetadata(participant).showCircle;
  return typeof value === 'boolean' ? value : true;
};

const connectionStateLabel = (state: ConnectionState) => {
  switch (state) {
    case ConnectionState.Connected:
      return 'Conectado';
    case ConnectionState.Connecting:
      return 'Conectando...';
    case ConnectionState.Reconnecting:
    case ConnectionState.SignalReconnecting:
      return 'Reconectando...';
    case ConnectionState.Disconnected:
    default:
      return 'Desconectado';
  }
};

const safeErrorMessage = (error: unknown) =>
  error instanceof Error && error.message ? error.message : 'Unexpected LiveKit error.';

const normalizeCoursePathPart = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const toPresentationHrefKey = (href: string | null | undefined) => {
  const normalizedHref = normalizeText(href);
  if (!normalizedHref) return '';

  try {
    const url = new URL(normalizedHref, window.location.origin);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return normalizedHref;
  }
};

const readPresentationCoursePathSegment = (href: string | null | undefined) => {
  const normalizedHref = normalizeText(href);
  if (!normalizedHref) return '';

  try {
    const url = new URL(normalizedHref, window.location.origin);
    const parts = url.pathname
      .split('/')
      .filter(Boolean)
      .map(normalizeCoursePathPart);

    if (parts[0] === 'cursos' && parts[1] === 'slides' && parts[2]) {
      return parts[2];
    }

    if (parts[0] === 'cursos' && parts[1]) {
      return parts[1];
    }

    return '';
  } catch {
    return '';
  }
};

const readPresentationPageSlug = (href: string | null | undefined) => {
  const normalizedHref = normalizeText(href);
  if (!normalizedHref) return '';

  try {
    const url = new URL(normalizedHref, window.location.origin);
    const parts = url.pathname
      .split('/')
      .filter(Boolean)
      .map(normalizeCoursePathPart);

    if (parts[0] === 'cursos' && parts[1] === 'slides' && parts.length >= 4) {
      return [parts[2], ...parts.slice(3)].join('/');
    }

    if (parts[0] === 'cursos' && parts.length >= 3) {
      return parts.slice(1).join('/');
    }

    return '';
  } catch {
    return '';
  }
};

const normalizeSlideState = (value: Partial<SlideState> | null | undefined): SlideState | null => {
  if (!value || typeof value !== 'object') return null;
  const indexh = Number(value.indexh);
  const indexv = Number(value.indexv);
  const indexf = Number(value.indexf);
  const zoom = Number(value.zoom);
  if (!Number.isFinite(indexh) || !Number.isFinite(indexv) || !Number.isFinite(indexf)) {
    return null;
  }
  return {
    indexf: Math.max(0, Math.round(indexf)),
    indexh: Math.max(0, Math.round(indexh)),
    indexv: Math.max(0, Math.round(indexv)),
    zoom: Math.min(1.4, Math.max(0.45, Number.isFinite(zoom) ? zoom : 1)),
  };
};

const fallbackDeviceLabel = (kind: 'audioinput' | 'videoinput', index: number) =>
  kind === 'audioinput' ? `Microfono ${index + 1}` : `Camara ${index + 1}`;

const formatElapsedTime = (elapsedMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
};

const populateDeviceSelect = ({
  activeDeviceId,
  devices,
  emptyLabel,
  kind,
  select,
}: {
  activeDeviceId?: string;
  devices: MediaDeviceInfo[];
  emptyLabel: string;
  kind: 'audioinput' | 'videoinput';
  select: HTMLSelectElement;
}) => {
  const previousValue = normalizeText(select.value);
  select.innerHTML = '';

  if (devices.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = emptyLabel;
    select.appendChild(option);
    return;
  }

  devices.forEach((device, index) => {
    const option = document.createElement('option');
    option.value = device.deviceId;
    option.textContent = normalizeText(device.label) || fallbackDeviceLabel(kind, index);
    select.appendChild(option);
  });

  const preferredValue = [activeDeviceId, previousValue, devices[0]?.deviceId]
    .map((value) => normalizeText(value))
    .find((value) => value && devices.some((device) => device.deviceId === value));

  if (preferredValue) {
    select.value = preferredValue;
  }
};

const createMediaElement = (track: Track, muted = false) => {
  const element = document.createElement(track.kind === Track.Kind.Video ? 'video' : 'audio');
  element.autoplay = true;
  element.playsInline = true;
  element.muted = muted;
  if (track.kind === Track.Kind.Audio) {
    element.hidden = true;
  }
  return element;
};

const isLocalCameraTrackLike = (value: unknown): value is LocalCameraTrackLike =>
  Boolean(
    value &&
      typeof value === 'object' &&
      (value as { kind?: Track.Kind }).kind === Track.Kind.Video &&
      typeof (value as { setProcessor?: unknown }).setProcessor === 'function',
  );

const isBackgroundBlurProcessorActive = (track: LocalCameraTrackLike | null | undefined) =>
  normalizeText(track?.getProcessor?.()?.name) === BACKGROUND_BLUR_PROCESSOR_NAME;

class BackgroundBlurVideoProcessor implements VideoTrackProcessorLike {
  name = BACKGROUND_BLUR_PROCESSOR_NAME;
  processedTrack?: MediaStreamTrack;

  private animationId = 0;
  private blurCanvas: HTMLCanvasElement | null = null;
  private blurContext: CanvasRenderingContext2D | null = null;
  private destroyed = false;
  private drawingUtils: InstanceType<VisionTasksModule['DrawingUtils']> | null = null;
  private element: HTMLVideoElement | null = null;
  private lastMask: VisionMask | null = null;
  private lastSegmentationAt = 0;
  private outputCanvas: HTMLCanvasElement | null = null;
  private outputContext: CanvasRenderingContext2D | null = null;
  private outputStream: MediaStream | null = null;
  private personMaskIndex = 0;
  private segmenter: InstanceType<VisionTasksModule['ImageSegmenter']> | null = null;

  private closeMask(mask: VisionMask | null | undefined) {
    try {
      mask?.close();
    } catch {
      // ignore mask close failures
    }
  }

  private async createSegmenter() {
    const vision = await loadVisionTasksModule();
    const wasmFileset = await loadVisionTasksFileset();
    const baseOptions = {
      modelAssetPath: BACKGROUND_BLUR_MODEL_ASSET,
    };

    let lastError: unknown = null;
    for (const delegate of ['GPU', 'CPU'] as const) {
      try {
        return await vision.ImageSegmenter.createFromOptions(wasmFileset as never, {
          baseOptions: {
            ...baseOptions,
            delegate,
          },
          outputCategoryMask: false,
          outputConfidenceMasks: true,
          runningMode: 'VIDEO',
        });
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Could not initialize background blur.');
  }

  private ensureCanvasSize(width: number, height: number) {
    if (!this.outputCanvas || !this.blurCanvas) return;
    if (this.outputCanvas.width === width && this.outputCanvas.height === height) return;

    this.outputCanvas.width = width;
    this.outputCanvas.height = height;
    this.blurCanvas.width = width;
    this.blurCanvas.height = height;
  }

  private readPersonMask(result: Awaited<ReturnType<InstanceType<VisionTasksModule['ImageSegmenter']>['segmentForVideo']>>) {
    const masks = result?.confidenceMasks;
    if (!masks || masks.length === 0) {
      this.closeMask(result?.categoryMask);
      return null;
    }

    const selectedMask = masks[this.personMaskIndex] || masks[masks.length - 1] || null;
    const clonedMask = selectedMask?.clone() || null;

    masks.forEach((mask) => this.closeMask(mask));
    this.closeMask(result.categoryMask);

    return clonedMask;
  }

  private renderFrame = () => {
    if (
      this.destroyed ||
      !this.element ||
      !this.outputCanvas ||
      !this.outputContext ||
      !this.blurCanvas ||
      !this.blurContext
    ) {
      return;
    }

    const width = Math.max(2, Math.round(this.element.videoWidth || 0));
    const height = Math.max(2, Math.round(this.element.videoHeight || 0));

    if (this.element.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || width < 2 || height < 2) {
      this.animationId = window.requestAnimationFrame(this.renderFrame);
      return;
    }

    this.ensureCanvasSize(width, height);

    const overscanX = Math.round(width * 0.03);
    const overscanY = Math.round(height * 0.03);
    this.blurContext.clearRect(0, 0, width, height);
    this.blurContext.save();
    this.blurContext.filter = 'blur(20px) saturate(0.92)';
    this.blurContext.drawImage(
      this.element,
      -overscanX,
      -overscanY,
      width + overscanX * 2,
      height + overscanY * 2,
    );
    this.blurContext.restore();

    const now = performance.now();
    if (this.segmenter && now - this.lastSegmentationAt >= 80) {
      this.lastSegmentationAt = now;
      try {
        const nextResult = this.segmenter.segmentForVideo(this.element, now);
        const nextMask = this.readPersonMask(nextResult);
        if (nextMask) {
          this.closeMask(this.lastMask);
          this.lastMask = nextMask;
        }
      } catch {
        // Keep the last valid mask if a frame fails.
      }
    }

    this.outputContext.clearRect(0, 0, width, height);
    if (this.lastMask && this.drawingUtils) {
      this.drawingUtils.drawConfidenceMask(this.lastMask, this.blurCanvas, this.element);
    } else {
      this.outputContext.drawImage(this.element, 0, 0, width, height);
    }

    this.animationId = window.requestAnimationFrame(this.renderFrame);
  };

  async init(opts: {
    element?: HTMLMediaElement;
    kind: Track.Kind.Video;
    track: MediaStreamTrack;
  }) {
    this.destroyed = false;
    this.element =
      opts.element instanceof HTMLVideoElement
        ? opts.element
        : document.createElement('video');
    this.outputCanvas = document.createElement('canvas');
    this.blurCanvas = document.createElement('canvas');
    this.outputContext = this.outputCanvas.getContext('2d', { alpha: false });
    this.blurContext = this.blurCanvas.getContext('2d', { alpha: false });

    if (!this.outputContext || !this.blurContext) {
      throw new Error('Could not initialize background blur compositor.');
    }

    this.outputContext.imageSmoothingEnabled = true;
    this.outputContext.imageSmoothingQuality = 'high';
    this.blurContext.imageSmoothingEnabled = true;
    this.blurContext.imageSmoothingQuality = 'high';

    const vision = await loadVisionTasksModule();
    this.segmenter = await this.createSegmenter();
    this.drawingUtils = new vision.DrawingUtils(this.outputContext);

    const labels = this.segmenter.getLabels?.() || [];
    const maskIndex = labels.findIndex((label) => /person|selfie|foreground/i.test(String(label)));
    this.personMaskIndex = maskIndex >= 0 ? maskIndex : Math.max(0, labels.length - 1);

    this.outputStream = this.outputCanvas.captureStream(30);
    this.processedTrack = this.outputStream.getVideoTracks()[0];
    this.renderFrame();
  }

  async restart(opts: {
    element?: HTMLMediaElement;
    kind: Track.Kind.Video;
    track: MediaStreamTrack;
  }) {
    await this.destroy();
    await this.init(opts);
  }

  async destroy() {
    this.destroyed = true;
    if (this.animationId) {
      window.cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }

    this.closeMask(this.lastMask);
    this.lastMask = null;
    this.drawingUtils?.close?.();
    this.drawingUtils = null;
    this.segmenter?.close?.();
    this.segmenter = null;
    this.outputStream?.getTracks().forEach((track) => track.stop());
    this.outputStream = null;
    this.processedTrack = undefined;
    this.outputCanvas = null;
    this.outputContext = null;
    this.blurCanvas = null;
    this.blurContext = null;
    this.element = null;
  }
}

const createHandLandmarker = async (): Promise<VisionHandLandmarker> => {
  const vision = await loadVisionTasksModule();
  const wasmFileset = await loadVisionTasksFileset();
  const baseOptions = {
    modelAssetPath: HAND_LANDMARKER_MODEL_ASSET,
  };

  let lastError: unknown = null;
  for (const delegate of ['GPU', 'CPU'] as const) {
    try {
      return await vision.HandLandmarker.createFromOptions(wasmFileset as never, {
        baseOptions: {
          ...baseOptions,
          delegate,
        },
        numHands: 1,
        runningMode: 'VIDEO',
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Could not initialize hand tracking.');
};

const appendBlurBackdrop = ({
  stream,
  track,
  wrapper,
}: {
  stream?: MediaStream | null;
  track?: MediaStreamTrack | null;
  wrapper: HTMLElement;
}) => {
  const sourceStream = stream || (track ? new MediaStream([track]) : null);
  if (!sourceStream) return;

  const backdrop = document.createElement('video');
  backdrop.autoplay = true;
  backdrop.muted = true;
  backdrop.playsInline = true;
  backdrop.className = 'conference-media-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  backdrop.srcObject = sourceStream;

  wrapper.classList.add('conference-media-frame--with-backdrop');
  wrapper.appendChild(backdrop);
  void backdrop.play().catch(() => undefined);
};

const removeMount = (mount: MediaMount | ParticipantMount | undefined) => {
  if (!mount) return;
  if (mount.attached !== false) {
    mount.track.detach(mount.element);
  }
  mount.element.remove();
  if ('wrapper' in mount) {
    mount.wrapper.remove();
  }
};

const cloneTemplate = (template: HTMLTemplateElement) => {
  const firstChild = template.content.firstElementChild;
  if (!(firstChild instanceof HTMLElement)) {
    throw new Error('Conference template is empty.');
  }
  return firstChild.cloneNode(true) as HTMLElement;
};

const getTrackSid = (publication: TrackPublication) => normalizeText(publication.trackSid);

const isLocalParticipant = (room: Room, participant: Participant) =>
  participant.identity === room.localParticipant.identity;

const hasCameraTrack = (participant: Participant) =>
  Array.from(participant.videoTrackPublications.values()).some(
    (entry) => entry.track && entry.source !== Track.Source.ScreenShare,
  );

const syncParticipantVideo = (
  room: Room,
  participant: Participant,
  card: ParticipantCardRefs,
  mounts: MountCollection,
  options: {
    blurLocalVideo?: boolean;
  } = {},
) => {
  const publication = Array.from(participant.videoTrackPublications.values()).find(
    (entry) => entry.track && entry.source !== Track.Source.ScreenShare,
  );
  const identity = participant.identity;
  const existingMount = mounts.participantVideoMounts.get(identity);
  const localParticipant = isLocalParticipant(room, participant);

  if (!publication?.track) {
    removeMount(existingMount);
    mounts.participantVideoMounts.delete(identity);
    card.media.innerHTML = '';
    card.placeholder.hidden = false;
    return;
  }

  const trackSid = getTrackSid(publication);
  const shouldRenderBackdrop = Boolean(
    options.blurLocalVideo &&
      localParticipant &&
      !isBackgroundBlurProcessorActive(isLocalCameraTrackLike(publication.track) ? publication.track : null),
  );
  const hasRenderedBackdrop = Boolean(existingMount?.wrapper.querySelector('.conference-media-backdrop'));
  if (
    existingMount &&
    existingMount.trackSid === trackSid &&
    existingMount.track === publication.track &&
    shouldRenderBackdrop === hasRenderedBackdrop
  ) {
    card.placeholder.hidden = true;
    return;
  }

  removeMount(existingMount);
  card.media.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = localParticipant
    ? 'conference-media-frame conference-media-frame--local-camera'
    : 'conference-media-frame';

  if (shouldRenderBackdrop) {
    const backdropTrack = (
      publication.track as { mediaStreamTrack?: MediaStreamTrack | null } | undefined
    )?.mediaStreamTrack;
    appendBlurBackdrop({
      track: backdropTrack,
      wrapper,
    });
  }

  const element = createMediaElement(publication.track, localParticipant);
  wrapper.appendChild(element);
  card.media.appendChild(wrapper);
  publication.track.attach(element);

  mounts.participantVideoMounts.set(identity, {
    element,
    track: publication.track,
    trackSid,
    wrapper,
  });

  card.placeholder.hidden = true;
};

const syncParticipantAudio = (
  room: Room,
  participant: Participant,
  card: ParticipantCardRefs,
  mounts: MountCollection,
) => {
  const identity = participant.identity;
  const existingMount = mounts.participantAudioMounts.get(identity);

  if (isLocalParticipant(room, participant)) {
    removeMount(existingMount);
    mounts.participantAudioMounts.delete(identity);
    return;
  }

  const publication = Array.from(participant.audioTrackPublications.values()).find(
    (entry) => entry.track && entry.source !== Track.Source.ScreenShareAudio,
  );

  if (!publication?.track) {
    removeMount(existingMount);
    mounts.participantAudioMounts.delete(identity);
    return;
  }

  const trackSid = getTrackSid(publication);
  if (existingMount && existingMount.trackSid === trackSid && existingMount.track === publication.track) {
    return;
  }

  removeMount(existingMount);

  const element = createMediaElement(publication.track);
  card.card.appendChild(element);
  publication.track.attach(element);
  void element.play().catch(() => undefined);

  mounts.participantAudioMounts.set(identity, {
    attached: true,
    element,
    track: publication.track,
    trackSid,
  });
};

const syncScreenVideo = (
  participant: Participant,
  screenSlot: HTMLElement,
  screenTemplate: HTMLTemplateElement,
  screenCards: Map<string, ScreenCardRefs>,
  mounts: MountCollection,
) => {
  const identity = participant.identity;
  const publication = Array.from(participant.videoTrackPublications.values()).find(
    (entry) => entry.track && entry.source === Track.Source.ScreenShare,
  );
  const existingMount = mounts.screenVideoMounts.get(identity);

  if (!publication?.track) {
    removeMount(existingMount);
    mounts.screenVideoMounts.delete(identity);
    const screenCard = screenCards.get(identity);
    if (screenCard) {
      removeMount(mounts.screenAudioMounts.get(identity));
      mounts.screenAudioMounts.delete(identity);
      screenCard.card.remove();
      screenCards.delete(identity);
    }
    return;
  }

  let screenCard = screenCards.get(identity);
  if (!screenCard) {
    const card = cloneTemplate(screenTemplate);
    const media = card.querySelector('[data-screen-media]');
    const name = card.querySelector('[data-screen-name]');

    if (!(media instanceof HTMLElement) || !(name instanceof HTMLElement)) {
      throw new Error('Screen card template is invalid.');
    }

    screenCard = { card, media, name };
    screenCards.set(identity, screenCard);
    screenSlot.appendChild(card);
  }

  screenCard.name.textContent = readParticipantName(participant);

  const trackSid = getTrackSid(publication);
  if (existingMount && existingMount.trackSid === trackSid && existingMount.track === publication.track) {
    return;
  }

  removeMount(existingMount);
  screenCard.media.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'conference-media-frame conference-media-frame--screen';

  const element = createMediaElement(publication.track);
  wrapper.appendChild(element);
  screenCard.media.appendChild(wrapper);
  publication.track.attach(element);

  mounts.screenVideoMounts.set(identity, {
    element,
    track: publication.track,
    trackSid,
    wrapper,
  });
};

const syncScreenAudio = (
  room: Room,
  participant: Participant,
  screenCards: Map<string, ScreenCardRefs>,
  mounts: MountCollection,
) => {
  const identity = participant.identity;
  const existingMount = mounts.screenAudioMounts.get(identity);
  const screenCard = screenCards.get(identity);

  if (!screenCard || isLocalParticipant(room, participant)) {
    removeMount(existingMount);
    mounts.screenAudioMounts.delete(identity);
    return;
  }

  const publication = Array.from(participant.audioTrackPublications.values()).find(
    (entry) => entry.track && entry.source === Track.Source.ScreenShareAudio,
  );

  if (!publication?.track) {
    removeMount(existingMount);
    mounts.screenAudioMounts.delete(identity);
    return;
  }

  const trackSid = getTrackSid(publication);
  if (existingMount && existingMount.trackSid === trackSid && existingMount.track === publication.track) {
    return;
  }

  removeMount(existingMount);

  const element = createMediaElement(publication.track);
  screenCard.card.appendChild(element);
  publication.track.attach(element);
  void element.play().catch(() => undefined);

  mounts.screenAudioMounts.set(identity, {
    attached: true,
    element,
    track: publication.track,
    trackSid,
  });
};

export const mountLiveKitRoom = (root: HTMLElement) => {
  if (root.dataset.mounted === 'true') {
    return () => {};
  }

  let livekitUrl = normalizeText(root.dataset.livekitUrl);
  const courseId = normalizeText(root.dataset.courseId);

  const roomInput = root.querySelector('[data-room-input]');
  const identityInput = root.querySelector('[data-identity-input]');
  const nameInput = root.querySelector('[data-name-input]');
  const roleInput = root.querySelector('[data-role-input]');
  const roleLabel = root.querySelector('[data-role-label]');
  const layoutInput = root.querySelector('[data-layout-input]');
  const audioInputSelects = Array.from(root.querySelectorAll('[data-audio-input-select]')).filter(
    (node): node is HTMLSelectElement => node instanceof HTMLSelectElement,
  );
  const videoInputSelects = Array.from(root.querySelectorAll('[data-video-input-select]')).filter(
    (node): node is HTMLSelectElement => node instanceof HTMLSelectElement,
  );
  const audioInputSelect = audioInputSelects[0] || null;
  const videoInputSelect = videoInputSelects[0] || null;
  const presentationSelect = root.querySelector('[data-presentation-select]');
  const previewZoomInput = root.querySelector('[data-preview-zoom-input]');
  const previewZoomOutput = root.querySelector('[data-preview-zoom-output]');
  const previewBlurInput = root.querySelector('[data-preview-blur-input]');
  const showCircleInput = root.querySelector('[data-show-circle-input]');
  const statusNode = root.querySelector('[data-room-status]');
  const stateNode = root.querySelector('[data-room-state]');
  const countNode = root.querySelector('[data-participant-count]');
  const connectToggleButton = root.querySelector('[data-action="connect-toggle"]');
  const connectButton = root.querySelector('[data-action="connect"]');
  const disconnectButton = root.querySelector('[data-action="disconnect"]');
  const cameraButton = root.querySelector('[data-action="camera"]');
  const microphoneButton = root.querySelector('[data-action="microphone"]');
  const micMeter = root.querySelector('[data-mic-meter]');
  const shareScreenButton = root.querySelector('[data-action="screen-share"]');
  const presentationButton = root.querySelector('[data-action="presentation"]');
  const presentationClearButton = root.querySelector('[data-action="presentation-clear"]');
  const layoutChoiceButtons = Array.from(root.querySelectorAll('[data-layout-choice]'));
  const audioInputPanel = root.querySelector('[data-audio-input-panel]');
  const videoInputPanel = root.querySelector('[data-video-input-panel]');
  const teacherSlot = root.querySelector('[data-slot="teacher"]');
  const gridSlot = root.querySelector('[data-slot="grid"]');
  const studentsSlot = root.querySelector('[data-slot="students"]');
  const screenSlot = root.querySelector('[data-slot="screen"]');
  const identityPreviewSlot = root.querySelector('[data-slot="identity-preview"]');
  const participantList = root.querySelector('[data-participant-list]');
  const stage = root.querySelector('[data-stage]');
  const stageFrameNode = root.querySelector('.conference-stage-frame');
  const participantTemplate = root.querySelector('[data-template="participant-card"]');
  const screenTemplate = root.querySelector('[data-template="screen-card"]');
  const presentationFrame = root.querySelector('[data-presentation-frame]');
  const presentationPlaceholder = root.querySelector('[data-presentation-placeholder]');
  const liveActivityButton = root.querySelector('[data-live-activity-button]');
  const liveActivityTimer = root.querySelector('[data-live-activity-timer]');
  const sessionTimer = root.querySelector('[data-session-timer]');
  const recordButton = root.querySelector('[data-action="record"]');
  const fullscreenButton = root.querySelector('[data-action="fullscreen"]');
  const sidebarToggleButton = root.querySelector('[data-action="sidebar-toggle"]');
  const instrumentsToggleButton = root.querySelector('[data-action="instruments-toggle"]');
  const chatList = root.querySelector('[data-chat-list]');
  const chatInput = root.querySelector('[data-chat-input]');
  const chatSendButton = root.querySelector('[data-action="chat-send"]');
  const chatDownloadButton = root.querySelector('[data-action="chat-download"]');
  const raiseHandButton = root.querySelector('[data-action="raise-hand"]');
  const handTrackInput = root.querySelector('[data-hand-track-input]');
  const synthMasterInput = root.querySelector('[data-synth-master-input]');
  const synthMasterOutput = root.querySelector('[data-synth-master-output]');
  const synthCarrierInput = root.querySelector('[data-synth-carrier-input]');
  const synthCarrierOutput = root.querySelector('[data-synth-carrier-output]');
  const synthModulatorInput = root.querySelector('[data-synth-modulator-input]');
  const synthModulatorOutput = root.querySelector('[data-synth-modulator-output]');
  const synthGainInput = root.querySelector('[data-synth-gain-input]');
  const synthGainOutput = root.querySelector('[data-synth-gain-output]');
  const synthCutoffInput = root.querySelector('[data-synth-cutoff-input]');
  const synthCutoffOutput = root.querySelector('[data-synth-cutoff-output]');
  const synthResonanceInput = root.querySelector('[data-synth-resonance-input]');
  const synthResonanceOutput = root.querySelector('[data-synth-resonance-output]');

  if (
    !(roomInput instanceof HTMLInputElement) ||
    !(identityInput instanceof HTMLInputElement) ||
    !(nameInput instanceof HTMLInputElement) ||
    !(roleInput instanceof HTMLInputElement) ||
    !(layoutInput instanceof HTMLSelectElement) ||
    !(presentationSelect instanceof HTMLSelectElement) ||
    !(statusNode instanceof HTMLElement) ||
    !(stateNode instanceof HTMLElement) ||
    !(countNode instanceof HTMLElement) ||
    !(cameraButton instanceof HTMLButtonElement) ||
    !(microphoneButton instanceof HTMLButtonElement) ||
    !(shareScreenButton instanceof HTMLButtonElement) ||
    !(teacherSlot instanceof HTMLElement) ||
    !(gridSlot instanceof HTMLElement) ||
    !(studentsSlot instanceof HTMLElement) ||
    !(screenSlot instanceof HTMLElement) ||
    !(participantList instanceof HTMLElement) ||
    !(stage instanceof HTMLElement) ||
    !(participantTemplate instanceof HTMLTemplateElement) ||
    !(screenTemplate instanceof HTMLTemplateElement) ||
    !(presentationFrame instanceof HTMLIFrameElement) ||
    !(presentationPlaceholder instanceof HTMLElement) ||
    !(sessionTimer instanceof HTMLElement) ||
    !(recordButton instanceof HTMLButtonElement) ||
    !(chatList instanceof HTMLElement) ||
    !(chatInput instanceof HTMLTextAreaElement) ||
    !(chatSendButton instanceof HTMLButtonElement) ||
    !(chatDownloadButton instanceof HTMLButtonElement)
  ) {
    const missingDomNodes: string[] = [];
    if (!(roomInput instanceof HTMLInputElement)) missingDomNodes.push('room input');
    if (!(identityInput instanceof HTMLInputElement)) missingDomNodes.push('identity input');
    if (!(nameInput instanceof HTMLInputElement)) missingDomNodes.push('name input');
    if (!(roleInput instanceof HTMLInputElement)) missingDomNodes.push('role input');
    if (!(layoutInput instanceof HTMLSelectElement)) missingDomNodes.push('layout select');
    if (!(presentationSelect instanceof HTMLSelectElement)) missingDomNodes.push('presentation select');
    if (!(statusNode instanceof HTMLElement)) missingDomNodes.push('status node');
    if (!(stateNode instanceof HTMLElement)) missingDomNodes.push('state node');
    if (!(countNode instanceof HTMLElement)) missingDomNodes.push('participant count');
    if (
      !(connectToggleButton instanceof HTMLButtonElement) &&
      !(connectButton instanceof HTMLButtonElement)
    ) {
      missingDomNodes.push('connect control');
    }
    if (!(cameraButton instanceof HTMLButtonElement)) missingDomNodes.push('camera button');
    if (!(microphoneButton instanceof HTMLButtonElement)) missingDomNodes.push('microphone button');
    if (!(shareScreenButton instanceof HTMLButtonElement)) missingDomNodes.push('screen share button');
    if (!(teacherSlot instanceof HTMLElement)) missingDomNodes.push('teacher slot');
    if (!(gridSlot instanceof HTMLElement)) missingDomNodes.push('grid slot');
    if (!(studentsSlot instanceof HTMLElement)) missingDomNodes.push('students slot');
    if (!(screenSlot instanceof HTMLElement)) missingDomNodes.push('screen slot');
    if (!(participantList instanceof HTMLElement)) missingDomNodes.push('participant list');
    if (!(stage instanceof HTMLElement)) missingDomNodes.push('stage');
    if (!(participantTemplate instanceof HTMLTemplateElement)) missingDomNodes.push('participant template');
    if (!(screenTemplate instanceof HTMLTemplateElement)) missingDomNodes.push('screen template');
    if (!(presentationFrame instanceof HTMLIFrameElement)) missingDomNodes.push('presentation frame');
    if (!(presentationPlaceholder instanceof HTMLElement)) missingDomNodes.push('presentation placeholder');
    if (!(sessionTimer instanceof HTMLElement)) missingDomNodes.push('session timer');
    if (!(recordButton instanceof HTMLButtonElement)) missingDomNodes.push('record button');
    if (!(chatList instanceof HTMLElement)) missingDomNodes.push('chat list');
    if (!(chatInput instanceof HTMLTextAreaElement)) missingDomNodes.push('chat input');
    if (!(chatSendButton instanceof HTMLButtonElement)) missingDomNodes.push('chat send button');
    if (!(chatDownloadButton instanceof HTMLButtonElement)) missingDomNodes.push('chat download button');

    console.error(`Conference room DOM is incomplete: ${missingDomNodes.join(', ')}`);
    if (statusNode instanceof HTMLElement) {
      statusNode.textContent = 'La interfaz de la sala no pudo inicializarse correctamente.';
    }
    root.dataset.mounted = 'false';
    return () => {
      root.dataset.mounted = 'false';
    };
  }

  root.dataset.mounted = 'true';

  const query = new URLSearchParams(window.location.search);
  const persistedSetup = readPersistedRoomSetup();

  if (!query.has('room') && normalizeText(persistedSetup.room)) {
    roomInput.value = normalizeText(persistedSetup.room);
  }
  if (!query.has('identity') && normalizeText(persistedSetup.identity)) {
    identityInput.value = normalizeText(persistedSetup.identity);
  }
  if (!query.has('name') && normalizeText(persistedSetup.name)) {
    nameInput.value = normalizeText(persistedSetup.name);
  }

  const presentationCourseIdByHrefKey = new Map<string, string>();
  const presentationPageSlugByHrefKey = new Map<string, string>();
  const presentationCourseIdByPathSegment = new Map<string, string>();

  Array.from(presentationSelect.options).forEach((option) => {
    const href = normalizeText(option.value);
    if (!href) return;

    const hrefKey = toPresentationHrefKey(href);
    const optionCourseId = normalizeText(option.dataset.courseId);
    const optionLessonId = normalizeText(option.dataset.lessonId);
    const coursePathSegment = readPresentationCoursePathSegment(href);

    if (hrefKey) {
      if (optionCourseId) {
        presentationCourseIdByHrefKey.set(hrefKey, optionCourseId);
      }
      if (optionLessonId) {
        presentationPageSlugByHrefKey.set(hrefKey, optionLessonId);
      }
    }

    if (coursePathSegment && optionCourseId && !presentationCourseIdByPathSegment.has(coursePathSegment)) {
      presentationCourseIdByPathSegment.set(coursePathSegment, optionCourseId);
    }
  });

  const room = new Room({
    adaptiveStream: {
      pixelDensity: 'screen',
    },
    dynacast: true,
  });

  const presentation = createPresentationController({
    frame: presentationFrame,
    placeholder: presentationPlaceholder,
  });

  const participantCards = new Map<string, ParticipantCardRefs>();
  const screenCards = new Map<string, ScreenCardRefs>();
  const mounts: MountCollection = {
    participantAudioMounts: new Map(),
    participantVideoMounts: new Map(),
    screenAudioMounts: new Map(),
    screenVideoMounts: new Map(),
  };
  const chatMessages: Extract<ConferenceMessage, { type: 'chat' }>[] = [];

  let destroyed = false;
  let localRole = normalizeRole(roleInput.value);
  let pendingPresentationTask = 0;
  let activeDevicePanel: 'audio' | 'video' | null = null;
  let preferredAudioInputId = normalizeText(persistedSetup.preferredAudioInputId) || normalizeText(audioInputSelect?.value);
  let preferredVideoInputId = normalizeText(persistedSetup.preferredVideoInputId) || normalizeText(videoInputSelect?.value);
  let focusedParticipantIdentity = '';
  let localPreviewMount: ParticipantMount | null = null;
  let localPreviewStreamMount: LocalPreviewStreamMount | null = null;
  let disconnectedCameraPreviewEnabled = false;
  let layoutBeforeAutoScreenshare = normalizeLayoutMode(layoutInput.value);
  let autoSwitchedToScreenshare = false;
  let currentSlideState: SlideState | null = null;
  let pendingRemoteSlideState: SlideState | null = null;
  let lastPublishedSlideKey = '';
  let unsubscribeLiveActivity: (() => void) | null = null;
  let activeLiveSnapshot: LiveSnapshot | null = null;
  let liveActivityTickId = 0;
  let immersiveFullscreenActive = false;
  let connectedAtMs = 0;
  let recordingAnimationId = 0;
  let recordingAudioContext: AudioContext | null = null;
  let recordingCanvas: HTMLCanvasElement | null = null;
  let recordingCanvasContext: CanvasRenderingContext2D | null = null;
  let recordingDisplayStream: MediaStream | null = null;
  let recordingDisplayVideo: HTMLVideoElement | null = null;
  let recordingMediaElementSources: AudioNode[] = [];
  let recordingMicTrackClones: MediaStreamTrack[] = [];
  let recordingStream: MediaStream | null = null;
  let recordingChunks: Blob[] = [];
  let mediaRecorder: MediaRecorder | null = null;
  let recordingDataRequestId = 0;
  let recordingPresentationImage: HTMLImageElement | null = null;
  let recordingPresentationUrl = '';
  let recordingPresentationSnapshotTask: Promise<void> | null = null;
  let recordingPresentationLastSnapshotAt = 0;
  let micMeterAnimationId = 0;
  let micMeterAudioContext: AudioContext | null = null;
  let micMeterAnalyser: AnalyserNode | null = null;
  let micMeterData: Uint8Array | null = null;
  let micMeterSource: MediaStreamAudioSourceNode | null = null;
  let micMeterTrackId = '';
  let micMeterGeneration = 0;
  let localHandRaised = false;
  let previewZoom = normalizePreviewZoom(
    previewZoomInput instanceof HTMLInputElement
      ? previewZoomInput.value
      : persistedSetup.previewZoom,
    normalizePreviewZoom(persistedSetup.previewZoom, 1),
  );
  let previewBlur = Boolean(persistedSetup.previewBlur);
  let presentationCircleZoom = previewZoom;
  let showPresentationCircle = persistedSetup.showCircle !== false;
  let instrumentsOpen = persistedSetup.instrumentsOpen === true;
  let handTrackEnabled = Boolean(persistedSetup.handTrackEnabled);
  let synthMasterGain = normalizeMasterGain(
    synthMasterInput instanceof HTMLInputElement
      ? synthMasterInput.value
      : persistedSetup.synthMasterGain,
    normalizeMasterGain(persistedSetup.synthMasterGain, 0.35),
  );
  let sidebarCollapsed = root.dataset.sidebarCollapsed === 'true';
  let handTrackingAnimationId = 0;
  let handTrackingGeneration = 0;
  let handTrackingLandmarker: VisionHandLandmarker | null = null;
  let handTrackingLastDetectionAt = 0;
  const fmSynth = new FMSynthVoice();

  const getLocalCameraTrack = (): LocalCameraTrackLike | null => {
    const publication = Array.from(room.localParticipant.videoTrackPublications.values()).find(
      (entry) => entry.track && entry.source !== Track.Source.ScreenShare,
    );

    return isLocalCameraTrackLike(publication?.track) ? publication.track : null;
  };

  const syncLocalBackgroundBlurProcessor = async () => {
    const localCameraTrack = getLocalCameraTrack();
    if (!localCameraTrack) return;

    if (!previewBlur) {
      if (isBackgroundBlurProcessorActive(localCameraTrack)) {
        await localCameraTrack.stopProcessor?.().catch(() => undefined);
      }
      return;
    }

    if (isBackgroundBlurProcessorActive(localCameraTrack)) {
      return;
    }

    await localCameraTrack.setProcessor?.(new BackgroundBlurVideoProcessor(), true);
  };

  const resolvePresentationCourseId = (href: string | null | undefined) => {
    const hrefKey = toPresentationHrefKey(href);
    if (hrefKey) {
      const mappedByHref = presentationCourseIdByHrefKey.get(hrefKey);
      if (mappedByHref) return mappedByHref;
    }

    const coursePathSegment = readPresentationCoursePathSegment(href);
    if (coursePathSegment) {
      return presentationCourseIdByPathSegment.get(coursePathSegment) || coursePathSegment;
    }

    return '';
  };

  const resolvePresentationPageSlug = (href: string | null | undefined) => {
    const hrefKey = toPresentationHrefKey(href);
    if (hrefKey) {
      const mappedByHref = presentationPageSlugByHrefKey.get(hrefKey);
      if (mappedByHref) return mappedByHref;
    }

    return readPresentationPageSlug(href);
  };

  const getCurrentLayout = () => setLayout(stage, layoutInput.value);

  const getFullscreenTarget = () => root as WebkitFullscreenElement;

  const getFullscreenElement = () =>
    document.fullscreenElement ||
    (document as WebkitDocument).webkitFullscreenElement ||
    null;

  const canRequestFullscreen = () => {
    const target = getFullscreenTarget();
    return Boolean(target.requestFullscreen || target.webkitRequestFullscreen);
  };

  const canExitFullscreen = () =>
    Boolean(document.exitFullscreen || (document as WebkitDocument).webkitExitFullscreen);

  const applyImmersiveFullscreenState = (active: boolean) => {
    immersiveFullscreenActive = active;
    root.dataset.immersive = active ? 'true' : 'false';
    document.body.classList.toggle('room-page--immersive', active);

    if (active) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  };

  const syncFullscreenButton = () => {
    if (!(fullscreenButton instanceof HTMLButtonElement)) return;

    const active = Boolean(getFullscreenElement()) || immersiveFullscreenActive;
    const supported = true;
    fullscreenButton.disabled = !supported;
    fullscreenButton.dataset.active = active ? 'true' : 'false';
    fullscreenButton.title = active ? 'Salir de pantalla completa' : 'Pantalla completa';
    fullscreenButton.setAttribute(
      'aria-label',
      active ? 'Salir de pantalla completa' : 'Pantalla completa',
    );
  };

  const toggleFullscreen = async () => {
    const fullscreenElement = getFullscreenElement();
    const target = getFullscreenTarget();

    if (fullscreenElement) {
      const exitFullscreen =
        document.exitFullscreen?.bind(document) ||
        (document as WebkitDocument).webkitExitFullscreen?.bind(document);
      await exitFullscreen?.();
      applyImmersiveFullscreenState(false);
      return;
    }

    if (immersiveFullscreenActive) {
      applyImmersiveFullscreenState(false);
      return;
    }

    const requestFullscreen =
      target.requestFullscreen?.bind(target) || target.webkitRequestFullscreen?.bind(target);

    if (requestFullscreen) {
      await requestFullscreen();
      applyImmersiveFullscreenState(false);
      return;
    }

    applyImmersiveFullscreenState(true);
  };

  const setStatus = (message: string) => {
    statusNode.textContent = message;
  };

  const applySidebarCollapsedState = () => {
    root.dataset.sidebarCollapsed = sidebarCollapsed ? 'true' : 'false';
    if (sidebarToggleButton instanceof HTMLButtonElement) {
      sidebarToggleButton.dataset.collapsed = sidebarCollapsed ? 'true' : 'false';
      sidebarToggleButton.title = sidebarCollapsed
        ? 'Abrir sidebar (Cmd/Ctrl + Shift + /)'
        : 'Plegar sidebar (Cmd/Ctrl + Shift + /)';
      sidebarToggleButton.setAttribute(
        'aria-label',
        sidebarCollapsed ? 'Abrir sidebar' : 'Plegar sidebar',
      );
      sidebarToggleButton.setAttribute('aria-pressed', sidebarCollapsed ? 'true' : 'false');
    }
  };

  const applyPreviewZoomState = () => {
    root.style.setProperty('--conference-self-preview-zoom', previewZoom.toFixed(2));
    root.style.setProperty('--conference-circle-preview-zoom', presentationCircleZoom.toFixed(2));
    if (previewZoomInput instanceof HTMLInputElement) {
      previewZoomInput.value = previewZoom.toFixed(2);
    }
    if (previewZoomOutput instanceof HTMLOutputElement || previewZoomOutput instanceof HTMLElement) {
      previewZoomOutput.textContent = `${previewZoom.toFixed(2)}x`;
    }
  };

  const applyShowCircleState = () => {
    root.dataset.showCircle = showPresentationCircle ? 'true' : 'false';
    if (showCircleInput instanceof HTMLInputElement) {
      showCircleInput.checked = showPresentationCircle;
    }
  };

  const applyPreviewBlurState = () => {
    root.dataset.previewBlur = previewBlur ? 'true' : 'false';
    if (previewBlurInput instanceof HTMLInputElement) {
      previewBlurInput.checked = previewBlur;
    }
  };

  const renderSynthTelemetry = (telemetry: HandSynthTelemetry) => {
    if (synthCarrierInput instanceof HTMLInputElement) {
      synthCarrierInput.value = String(Math.round(telemetry.carrier));
    }
    if (synthCarrierOutput instanceof HTMLOutputElement || synthCarrierOutput instanceof HTMLElement) {
      synthCarrierOutput.textContent = `${Math.round(telemetry.carrier)} Hz`;
    }

    if (synthModulatorInput instanceof HTMLInputElement) {
      synthModulatorInput.value = telemetry.modulator.toFixed(2);
    }
    if (synthModulatorOutput instanceof HTMLOutputElement || synthModulatorOutput instanceof HTMLElement) {
      synthModulatorOutput.textContent = `${telemetry.modulator.toFixed(2)}x`;
    }

    if (synthGainInput instanceof HTMLInputElement) {
      synthGainInput.value = telemetry.gain.toFixed(2);
    }
    if (synthGainOutput instanceof HTMLOutputElement || synthGainOutput instanceof HTMLElement) {
      synthGainOutput.textContent = telemetry.gain.toFixed(2);
    }

    if (synthCutoffInput instanceof HTMLInputElement) {
      synthCutoffInput.value = String(Math.round(telemetry.cutoff));
    }
    if (synthCutoffOutput instanceof HTMLOutputElement || synthCutoffOutput instanceof HTMLElement) {
      synthCutoffOutput.textContent = `${Math.round(telemetry.cutoff)} Hz`;
    }

    if (synthResonanceInput instanceof HTMLInputElement) {
      synthResonanceInput.value = telemetry.resonance.toFixed(1);
    }
    if (
      synthResonanceOutput instanceof HTMLOutputElement ||
      synthResonanceOutput instanceof HTMLElement
    ) {
      synthResonanceOutput.textContent = `${telemetry.resonance.toFixed(1)} Q`;
    }
  };

  const applyInstrumentsOpenState = () => {
    root.dataset.instrumentsOpen = instrumentsOpen ? 'true' : 'false';
    if (instrumentsToggleButton instanceof HTMLButtonElement) {
      instrumentsToggleButton.dataset.active = instrumentsOpen ? 'true' : 'false';
      instrumentsToggleButton.setAttribute('aria-pressed', instrumentsOpen ? 'true' : 'false');
      instrumentsToggleButton.title = instrumentsOpen ? 'Hide Instruments' : 'Instruments';
    }
  };

  const applyHandTrackState = () => {
    if (handTrackInput instanceof HTMLInputElement) {
      handTrackInput.checked = handTrackEnabled;
    }
  };

  const applySynthMasterGainState = () => {
    if (synthMasterInput instanceof HTMLInputElement) {
      synthMasterInput.value = synthMasterGain.toFixed(2);
    }
    if (synthMasterOutput instanceof HTMLOutputElement || synthMasterOutput instanceof HTMLElement) {
      synthMasterOutput.textContent = synthMasterGain.toFixed(2);
    }
    fmSynth.setMasterGain(synthMasterGain);
  };

  const persistSetupState = () => {
    writePersistedRoomSetup({
      handTrackEnabled,
      room: normalizeText(roomInput.value),
      identity: normalizeText(identityInput.value),
      instrumentsOpen,
      name: normalizeText(nameInput.value),
      preferredAudioInputId,
      preferredVideoInputId,
      previewBlur,
      previewZoom,
      showCircle: showPresentationCircle,
      synthMasterGain,
    });
  };

  const getTrackingVideoElement = (): HTMLVideoElement | null => {
    if (localPreviewStreamMount?.element instanceof HTMLVideoElement) {
      return localPreviewStreamMount.element;
    }
    if (localPreviewMount?.element instanceof HTMLVideoElement) {
      return localPreviewMount.element;
    }
    if (!(identityPreviewSlot instanceof HTMLElement)) return null;
    const element = identityPreviewSlot.querySelector('video:not(.conference-media-backdrop)');
    return element instanceof HTMLVideoElement ? element : null;
  };

  const computeHandTelemetry = (landmarks: HandLandmarkPoint[]): HandSynthTelemetry | null => {
    const wrist = landmarks[0];
    const indexMcp = landmarks[5];
    const middleMcp = landmarks[9];
    const ringMcp = landmarks[13];
    const thumbMcp = landmarks[2];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const ringTip = landmarks[16];

    if (!wrist || !indexMcp || !middleMcp || !ringMcp || !thumbMcp || !thumbTip || !indexTip || !ringTip) {
      return null;
    }

    const palmX = clamp01((wrist.x + middleMcp.x + indexMcp.x) / 3);
    const palmY = clamp01((wrist.y + middleMcp.y) / 2);
    const thumbDistance = Math.hypot(thumbTip.x - thumbMcp.x, thumbTip.y - thumbMcp.y);
    const thumbGain = clamp01((thumbDistance - 0.04) / 0.22);
    const indexLift = clamp01(((indexMcp.y - indexTip.y) - 0.03) / 0.28);
    const ringLift = clamp01(((ringMcp.y - ringTip.y) - 0.03) / 0.3);

    return {
      carrier: roundTo(lerp(120, 1320, 1 - palmY), 0),
      modulator: roundTo(lerp(0.25, 8, palmX), 2),
      gain: roundTo(thumbGain, 2),
      cutoff: roundTo(Math.exp(lerp(Math.log(140), Math.log(7600), indexLift)), 0),
      resonance: roundTo(lerp(0.8, 18, ringLift), 1),
    };
  };

  const clearHandTrackingOutput = () => {
    fmSynth.clearHand();
    renderSynthTelemetry({
      carrier: 220,
      modulator: 1.2,
      gain: 0,
      cutoff: 800,
      resonance: 1,
    });
  };

  const stopHandTracking = () => {
    handTrackingGeneration += 1;
    handTrackingLastDetectionAt = 0;
    if (handTrackingAnimationId) {
      window.cancelAnimationFrame(handTrackingAnimationId);
      handTrackingAnimationId = 0;
    }
    clearHandTrackingOutput();
  };

  const ensureHandLandmarker = async () => {
    if (handTrackingLandmarker) return handTrackingLandmarker;
    handTrackingLandmarker = await createHandLandmarker();
    return handTrackingLandmarker;
  };

  const startHandTracking = async () => {
    if (!handTrackEnabled || destroyed) {
      stopHandTracking();
      return;
    }

    const generation = handTrackingGeneration + 1;
    handTrackingGeneration = generation;
    if (handTrackingAnimationId) {
      window.cancelAnimationFrame(handTrackingAnimationId);
      handTrackingAnimationId = 0;
    }

    try {
      await fmSynth.ensureReady();
      fmSynth.setMasterGain(synthMasterGain);
      const landmarker = await ensureHandLandmarker();
      if (!handTrackEnabled || destroyed || generation !== handTrackingGeneration) return;

      const tick = () => {
        if (!handTrackEnabled || destroyed || generation !== handTrackingGeneration) {
          return;
        }

        const video = getTrackingVideoElement();
        if (
          !video ||
          video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
          video.videoWidth < 2 ||
          video.videoHeight < 2
        ) {
          clearHandTrackingOutput();
          handTrackingAnimationId = window.requestAnimationFrame(tick);
          return;
        }

        const now = performance.now();
        if (now - handTrackingLastDetectionAt >= 50) {
          handTrackingLastDetectionAt = now;
          try {
            const result = landmarker.detectForVideo(video, now);
            const landmarks = Array.isArray(result.landmarks) && result.landmarks[0]
              ? (result.landmarks[0] as HandLandmarkPoint[])
              : null;
            const telemetry = landmarks ? computeHandTelemetry(landmarks) : null;

            if (telemetry) {
              renderSynthTelemetry(telemetry);
              fmSynth.update(telemetry);
            } else {
              clearHandTrackingOutput();
            }
          } catch {
            clearHandTrackingOutput();
          }
        }

        handTrackingAnimationId = window.requestAnimationFrame(tick);
      };

      handTrackingAnimationId = window.requestAnimationFrame(tick);
    } catch (error) {
      handTrackEnabled = false;
      applyHandTrackState();
      persistSetupState();
      clearHandTrackingOutput();
      setStatus(safeErrorMessage(error));
    }
  };

  const syncSelectGroupValue = (selects: HTMLSelectElement[], nextValue: string) => {
    selects.forEach((select) => {
      if (normalizeText(select.value) === nextValue) return;
      select.value = nextValue;
    });
  };

  const syncRoleUi = () => {
    roleInput.value = localRole;
    if (roleLabel instanceof HTMLElement) {
      roleLabel.textContent = formatRoleLabel(localRole);
    }
  };

  const readParticipantHandRaised = (participant: Participant) =>
    isLocalParticipant(room, participant)
      ? localHandRaised
      : readParticipantHandRaisedFromMetadata(participant);

  const syncRaiseHandUi = () => {
    if (!(raiseHandButton instanceof HTMLButtonElement)) return;
    raiseHandButton.dataset.active = localHandRaised ? 'true' : 'false';
    raiseHandButton.setAttribute('aria-pressed', localHandRaised ? 'true' : 'false');
    raiseHandButton.title = localHandRaised ? 'Bajar la mano (M)' : 'Levantar la mano (M)';
    raiseHandButton.setAttribute(
      'aria-label',
      localHandRaised ? 'Bajar la mano' : 'Levantar la mano',
    );
  };

  const updateLocalParticipantMetadata = async (metadata: string) => {
    const participant = room.localParticipant as LocalParticipant & {
      setMetadata?: (value: string) => Promise<void> | void;
    };
    if (typeof participant.setMetadata !== 'function') return;
    await participant.setMetadata(metadata);
  };

  const syncLocalParticipantMetadata = async () => {
    if (room.state !== ConnectionState.Connected) return;
    const currentMetadata = readParticipantMetadata(room.localParticipant as unknown as Participant);
    await updateLocalParticipantMetadata(
      JSON.stringify({
        ...currentMetadata,
        courseId: getEffectiveCourseId() || normalizeText(currentMetadata.courseId),
        pageSlug: getCurrentPresentationPageSlug() || normalizeText(currentMetadata.pageSlug),
        role: localRole,
        handRaised: localHandRaised,
        previewZoom,
        showCircle: showPresentationCircle,
      }),
    );
  };

  const toggleRaisedHand = async () => {
    localHandRaised = !localHandRaised;
    syncRaiseHandUi();
    syncAllParticipants();

    if (room.state !== ConnectionState.Connected) return;

    try {
      await syncLocalParticipantMetadata();
    } catch (error) {
      localHandRaised = !localHandRaised;
      syncRaiseHandUi();
      syncAllParticipants();
      setStatus(safeErrorMessage(error));
    }
  };

  const toggleSidebarCollapsed = () => {
    sidebarCollapsed = !sidebarCollapsed;
    applySidebarCollapsedState();
    persistSetupState();
    queuePreferredRemoteVideoDimensionsSync();
  };

  const toggleInstrumentsOpen = () => {
    instrumentsOpen = !instrumentsOpen;
    applyInstrumentsOpenState();
    persistSetupState();
  };

  const shouldIgnoreRoomShortcut = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest('input, textarea, select, button, [contenteditable="true"]'));
  };

  const setDevicePanelVisibility = (panel: HTMLElement | null, visible: boolean) => {
    if (!panel) return;
    panel.hidden = !visible;
    panel.dataset.open = visible ? 'true' : 'false';
  };

  const closeDevicePanels = () => {
    activeDevicePanel = null;
    setDevicePanelVisibility(audioInputPanel instanceof HTMLElement ? audioInputPanel : null, false);
    setDevicePanelVisibility(videoInputPanel instanceof HTMLElement ? videoInputPanel : null, false);
  };

  const openDevicePanel = (kind: 'audio' | 'video') => {
    activeDevicePanel = kind;
    setDevicePanelVisibility(audioInputPanel instanceof HTMLElement ? audioInputPanel : null, kind === 'audio');
    setDevicePanelVisibility(videoInputPanel instanceof HTMLElement ? videoInputPanel : null, kind === 'video');
  };

  const syncLayoutChoiceButtons = () => {
    const layoutLocked = layoutInput.disabled;
    layoutChoiceButtons.forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return;
      const buttonLayout = normalizeLayoutMode(button.dataset.layoutChoice || '');
      const isActive = buttonLayout === layoutInput.value;
      button.disabled = layoutLocked;
      button.dataset.active = isActive ? 'true' : 'false';
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  };

  const requestRemotePublicationDimensions = (
    publication: TrackPublication | undefined,
    target: HTMLElement,
    minimumWidth: number,
    minimumHeight: number,
  ) => {
    if (!(publication instanceof RemoteTrackPublication)) return;

    const rect = target.getBoundingClientRect();
    const pixelDensity = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(minimumWidth, Math.round(rect.width * pixelDensity));
    const height = Math.max(minimumHeight, Math.round(rect.height * pixelDensity));

    publication.setVideoDimensions({ width, height });
    if (typeof publication.setVideoFPS === 'function') {
      publication.setVideoFPS(30);
    }
  };

  const syncPreferredRemoteVideoDimensions = () => {
    const currentLayout = getCurrentLayout();

    allParticipants().forEach((participant) => {
      participant.videoTrackPublications.forEach((publication) => {
        if (publication.source === Track.Source.ScreenShare) {
          requestRemotePublicationDimensions(publication, screenSlot, 1920, 1080);
          return;
        }

        if (currentLayout === 'teacher' && participant.identity === focusedParticipantIdentity) {
          requestRemotePublicationDimensions(publication, teacherSlot, 1280, 720);
        }
      });
    });
  };

  const queuePreferredRemoteVideoDimensionsSync = () => {
    window.requestAnimationFrame(() => {
      syncPreferredRemoteVideoDimensions();
    });
  };

  const getCurrentPresentationHref = () =>
    normalizeText(presentationSelect.value) || presentation.getHref() || null;

  const getSelectedPresentationCourseId = () => {
    const selectedOption = presentationSelect.selectedOptions.item(0);
    if (selectedOption instanceof HTMLOptionElement) {
      const selectedCourseId = normalizeText(selectedOption.dataset.courseId);
      if (selectedCourseId) return selectedCourseId;
    }
    return resolvePresentationCourseId(
      selectedOption instanceof HTMLOptionElement
        ? normalizeText(selectedOption.value) || presentationSelect.value
        : presentationSelect.value,
    );
  };

  const getEffectiveCourseId = () =>
    getSelectedPresentationCourseId() ||
    resolvePresentationCourseId(getCurrentPresentationHref()) ||
    courseId;

  const getCurrentPresentationPageSlug = () => resolvePresentationPageSlug(getCurrentPresentationHref());

  const getLiveActivityHref = (snapshot: LiveSnapshot | null) => {
    const sessionId = normalizeText(snapshot?.sessionId);
    if (!sessionId) return '';
    const url = new URL(`/live/${encodeURIComponent(sessionId)}`, window.location.origin);
    const effectiveCourseId = getEffectiveCourseId() || normalizeText(snapshot?.courseId);
    if (effectiveCourseId) {
      url.searchParams.set('courseId', effectiveCourseId);
    }
    return `${url.pathname}${url.search}`;
  };

  const renderLiveActivity = () => {
    if (!(liveActivityButton instanceof HTMLButtonElement)) return;

    const snapshot = activeLiveSnapshot;
    const effectiveCourseId = getEffectiveCourseId();
    const effectivePageSlug = getCurrentPresentationPageSlug();
    const snapshotCourseId = normalizeText(snapshot?.courseId);
    const snapshotPageSlug = normalizeText(snapshot?.pageSlug);
    const remainingMs = snapshot?.endsAt ? getRemainingMs(snapshot.endsAt, Date.now()) : null;
    const courseMatches =
      !effectiveCourseId ||
      !snapshotCourseId ||
      snapshotCourseId === effectiveCourseId;
    const pageMatches =
      !effectivePageSlug ||
      !snapshotPageSlug ||
      snapshotPageSlug === effectivePageSlug;
    const isVisible = Boolean(
      snapshot?.active &&
      normalizeText(snapshot?.sessionId) &&
      (remainingMs === null || remainingMs > 0) &&
      (courseMatches || pageMatches),
    );

    liveActivityButton.hidden = !isVisible;
    liveActivityButton.disabled = !isVisible;
    if (!isVisible) {
      liveActivityButton.removeAttribute('data-live-href');
      if (liveActivityTimer instanceof HTMLElement) {
        liveActivityTimer.textContent = '--:--';
      }
      return;
    }

    const href = getLiveActivityHref(snapshot);
    liveActivityButton.dataset.liveHref = href;
    liveActivityButton.title = snapshot?.prompt
      ? `Interacción activa: ${snapshot.prompt}`
      : 'Interacción activa';

    if (liveActivityTimer instanceof HTMLElement) {
      liveActivityTimer.textContent = formatCountdown(remainingMs);
    }
  };

  const renderSessionTimer = () => {
    if (!(sessionTimer instanceof HTMLElement)) return;
    sessionTimer.textContent = connectedAtMs
      ? formatElapsedTime(Date.now() - connectedAtMs)
      : '00:00:00';
  };

  const setMicMeterLevel = (level: number) => {
    if (!(micMeter instanceof HTMLElement)) return;
    const normalizedLevel = Math.max(0, Math.min(1, level));
    micMeter.style.setProperty('--conference-mic-level', normalizedLevel.toFixed(3));
  };

  const closeMicMeterAudioContext = () => {
    if (!micMeterAudioContext) return;
    if (micMeterAudioContext.state !== 'closed') {
      void micMeterAudioContext.close().catch(() => undefined);
    }
    micMeterAudioContext = null;
  };

  const stopMicMeter = () => {
    micMeterGeneration += 1;

    if (micMeterAnimationId) {
      window.cancelAnimationFrame(micMeterAnimationId);
      micMeterAnimationId = 0;
    }

    if (micMeterSource) {
      try {
        micMeterSource.disconnect();
      } catch {
        // ignore disconnected nodes
      }
      micMeterSource = null;
    }

    if (micMeterAnalyser) {
      try {
        micMeterAnalyser.disconnect();
      } catch {
        // ignore disconnected nodes
      }
      micMeterAnalyser = null;
    }

    micMeterData = null;
    micMeterTrackId = '';
    setMicMeterLevel(0);

    if (micMeter instanceof HTMLElement) {
      micMeter.hidden = true;
    }
  };

  const startMicMeter = async (track: MediaStreamTrack) => {
    if (!(micMeter instanceof HTMLElement)) return;

    const trackId = normalizeText(track.id);
    if (
      trackId &&
      micMeterTrackId === trackId &&
      micMeterAudioContext &&
      micMeterAnalyser &&
      micMeterData
    ) {
      micMeter.hidden = false;
      return;
    }

    const nextGeneration = micMeterGeneration + 1;
    stopMicMeter();
    micMeterGeneration = nextGeneration;

    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextCtor) return;

    if (!micMeterAudioContext || micMeterAudioContext.state === 'closed') {
      micMeterAudioContext = new AudioContextCtor();
    }

    const audioContext = micMeterAudioContext;

    if (audioContext.state !== 'running') {
      await audioContext.resume().catch(() => undefined);
    }

    if (
      nextGeneration !== micMeterGeneration ||
      audioContext.state !== 'running' ||
      track.readyState !== 'live'
    ) {
      return;
    }

    let analyser: AnalyserNode;
    let source: MediaStreamAudioSourceNode;

    try {
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;

      source = audioContext.createMediaStreamSource(new MediaStream([track]));
      source.connect(analyser);
    } catch {
      stopMicMeter();
      return;
    }

    if (nextGeneration !== micMeterGeneration || audioContext.state !== 'running') {
      try {
        source.disconnect();
      } catch {
        // ignore disconnected nodes
      }
      try {
        analyser.disconnect();
      } catch {
        // ignore disconnected nodes
      }
      return;
    }

    micMeterSource = source;
    micMeterAnalyser = analyser;
    micMeterData = new Uint8Array(analyser.fftSize);
    micMeterTrackId = trackId;
    micMeter.hidden = false;

    const tick = () => {
      if (!micMeterAnalyser || !micMeterData) return;
      micMeterAnalyser.getByteTimeDomainData(micMeterData);

      let sum = 0;
      for (let index = 0; index < micMeterData.length; index += 1) {
        const normalizedSample = (micMeterData[index] - 128) / 128;
        sum += normalizedSample * normalizedSample;
      }

      const rms = Math.sqrt(sum / micMeterData.length);
      setMicMeterLevel(Math.min(1, rms * 4.5));
      micMeterAnimationId = window.requestAnimationFrame(tick);
    };

    tick();
  };

  const syncMicMeter = () => {
    const connected = room.state === ConnectionState.Connected;
    const microphoneEnabled = connected && room.localParticipant.isMicrophoneEnabled;
    const localMicPublication = Array.from(room.localParticipant.audioTrackPublications.values()).find(
      (entry) => entry.track && entry.source !== Track.Source.ScreenShareAudio,
    );

    const localMicTrack = (localMicPublication?.track as { mediaStreamTrack?: MediaStreamTrack } | undefined)
      ?.mediaStreamTrack;

    if (!microphoneEnabled || !localMicTrack || localMicTrack.readyState !== 'live') {
      stopMicMeter();
      return;
    }

    void startMicMeter(localMicTrack).catch(() => {
      stopMicMeter();
    });
  };

  const setRecordState = (isRecording: boolean) => {
    if (!(recordButton instanceof HTMLButtonElement)) return;
    recordButton.dataset.recording = isRecording ? 'true' : 'false';
    recordButton.disabled = room.state !== ConnectionState.Connected;
    recordButton.title = isRecording ? 'Detener grabacion' : 'Grabar transmision';
    recordButton.setAttribute(
      'aria-label',
      isRecording ? 'Detener grabacion' : 'Grabar transmision',
    );
  };

  const cancelRecordingFrame = () => {
    if (!recordingAnimationId) return;
    window.cancelAnimationFrame(recordingAnimationId);
    recordingAnimationId = 0;
  };

  const cleanupRecordingAudio = () => {
    recordingMediaElementSources.forEach((node) => {
      try {
        node.disconnect();
      } catch {
        // ignore disconnected nodes
      }
    });
    recordingMediaElementSources = [];

    recordingMicTrackClones.forEach((track) => track.stop());
    recordingMicTrackClones = [];

    if (recordingAudioContext) {
      void recordingAudioContext.close().catch(() => undefined);
      recordingAudioContext = null;
    }
  };

  const cleanupRecording = () => {
    cancelRecordingFrame();
    if (recordingDataRequestId) {
      window.clearInterval(recordingDataRequestId);
      recordingDataRequestId = 0;
    }
    cleanupRecordingAudio();
    if (recordingDisplayStream) {
      recordingDisplayStream.getTracks().forEach((track) => track.stop());
      recordingDisplayStream = null;
    }
    if (recordingDisplayVideo) {
      recordingDisplayVideo.pause();
      recordingDisplayVideo.srcObject = null;
      recordingDisplayVideo = null;
    }
    if (recordingStream) {
      recordingStream.getTracks().forEach((track) => track.stop());
      recordingStream = null;
    }
    recordingCanvasContext = null;
    recordingCanvas = null;
    mediaRecorder = null;
    recordingChunks = [];
    if (recordingPresentationUrl) {
      URL.revokeObjectURL(recordingPresentationUrl);
      recordingPresentationUrl = '';
    }
    recordingPresentationImage = null;
    recordingPresentationSnapshotTask = null;
    recordingPresentationLastSnapshotAt = 0;
    setRecordState(false);
  };

  const downloadRecording = (blob: Blob) => {
    const roomName = normalizeText(roomInput.value) || 'room';
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const href = URL.createObjectURL(blob);
    const normalizedType = normalizeText(blob.type).toLowerCase();
    const extension = normalizedType.includes('mp4')
      ? 'mp4'
      : normalizedType.includes('webm')
        ? 'webm'
        : 'bin';
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `${roomName}-${stamp}.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => {
      URL.revokeObjectURL(href);
    }, 1000);
  };

  const stopRecording = () => {
    if (!mediaRecorder) {
      cleanupRecording();
      return;
    }

    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      return;
    }

    cleanupRecording();
  };

  const getVisibleVideoElements = () =>
    Array.from(stageFrame.querySelectorAll('video')).filter((element): element is HTMLVideoElement => {
      if (!(element instanceof HTMLVideoElement)) return false;
      if (element.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return false;

      const rect = element.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return false;

      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
        return false;
      }

      return true;
    });

  const stageFrame =
    stageFrameNode instanceof HTMLElement
      ? stageFrameNode
      : stage;

  const getRecordingViewportRect = () => stageFrame.getBoundingClientRect();

  const getRecordingViewportSourceRect = (video: HTMLVideoElement) => {
    const viewportRect = getRecordingViewportRect();
    const viewportWidth = Math.max(1, window.innerWidth);
    const viewportHeight = Math.max(1, window.innerHeight);
    const scaleX = video.videoWidth / viewportWidth;
    const scaleY = video.videoHeight / viewportHeight;

    return {
      sx: Math.max(0, Math.round(viewportRect.left * scaleX)),
      sy: Math.max(0, Math.round(viewportRect.top * scaleY)),
      sw: Math.max(2, Math.round(viewportRect.width * scaleX)),
      sh: Math.max(2, Math.round(viewportRect.height * scaleY)),
    };
  };

  const createRecordingDisplayConstraints = () => ({
    video: {
      displaySurface: 'browser',
      frameRate: 30,
    },
    audio: false,
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
    surfaceSwitching: 'include',
  });

  const startRecordingDisplayCapture = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) return false;

    const stream = await navigator.mediaDevices.getDisplayMedia(
      createRecordingDisplayConstraints() as MediaStreamConstraints,
    );

    const [videoTrack] = stream.getVideoTracks();
    if (!videoTrack) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error('No se pudo obtener video de la captura.');
    }

    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('No se pudo iniciar la captura de la pestaña.'));
    });

    await video.play().catch(() => undefined);

    videoTrack.addEventListener('ended', () => {
      if (mediaRecorder?.state === 'recording') {
        stopRecording();
      } else {
        cleanupRecording();
      }
    });

    recordingDisplayStream = stream;
    recordingDisplayVideo = video;
    return true;
  };

  const drawVideoIntoRect = ({
    context,
    fit = 'cover',
    offsetX = 0.5,
    offsetY = 0.5,
    rect,
    video,
  }: {
    context: CanvasRenderingContext2D;
    fit?: 'contain' | 'cover';
    offsetX?: number;
    offsetY?: number;
    rect: DOMRect;
    video: HTMLVideoElement;
  }) => {
    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    const targetWidth = Math.max(1, rect.width);
    const targetHeight = Math.max(1, rect.height);

    if (!sourceWidth || !sourceHeight || !targetWidth || !targetHeight) return;

    const sourceAspect = sourceWidth / sourceHeight;
    const targetAspect = targetWidth / targetHeight;

    if (fit === 'contain') {
      let drawWidth = targetWidth;
      let drawHeight = drawWidth / sourceAspect;

      if (drawHeight > targetHeight) {
        drawHeight = targetHeight;
        drawWidth = drawHeight * sourceAspect;
      }

      const drawX = rect.x + (targetWidth - drawWidth) / 2;
      const drawY = rect.y + (targetHeight - drawHeight) / 2;
      context.drawImage(video, drawX, drawY, drawWidth, drawHeight);
      return;
    }

    let sx = 0;
    let sy = 0;
    let sw = sourceWidth;
    let sh = sourceHeight;

    if (sourceAspect > targetAspect) {
      sw = sourceHeight * targetAspect;
      sx = (sourceWidth - sw) * offsetX;
    } else {
      sh = sourceWidth / targetAspect;
      sy = (sourceHeight - sh) * offsetY;
    }

    sx = Math.max(0, Math.min(sx, sourceWidth - sw));
    sy = Math.max(0, Math.min(sy, sourceHeight - sh));

    context.drawImage(video, sx, sy, sw, sh, rect.x, rect.y, targetWidth, targetHeight);
  };

  const isPresentationCircleVideo = (video: HTMLVideoElement) =>
    Boolean(
      video.closest('.conference-stage-panel--focus') &&
      stage.dataset.layout === 'presentation',
    );

  const isSelfPreviewVideo = (video: HTMLVideoElement) =>
    Boolean(video.closest('.conference-self-preview'));

  const serializeComputedStyle = (style: CSSStyleDeclaration) => {
    const declarations: string[] = [];

    for (let index = 0; index < style.length; index += 1) {
      const propertyName = style.item(index);
      const propertyValue = style.getPropertyValue(propertyName);
      if (!propertyName || !propertyValue) continue;
      const priority = style.getPropertyPriority(propertyName);
      declarations.push(`${propertyName}:${propertyValue}${priority ? ' !important' : ''};`);
    }

    return declarations.join('');
  };

  const clonePresentationNode = (
    sourceNode: Node,
    snapshotDocument: Document,
    sourceWindow: Window,
  ): Node | null => {
    const xhtmlNamespace = 'http://www.w3.org/1999/xhtml';
    const svgNamespace = 'http://www.w3.org/2000/svg';

    if (sourceNode.nodeType === Node.TEXT_NODE) {
      return snapshotDocument.createTextNode(sourceNode.textContent || '');
    }

    if (!(sourceNode instanceof sourceWindow.Element)) {
      return null;
    }

    if (sourceNode instanceof sourceWindow.HTMLCanvasElement) {
      const image = snapshotDocument.createElementNS(xhtmlNamespace, 'img');
      image.setAttribute('src', sourceNode.toDataURL('image/png'));
      image.setAttribute('style', serializeComputedStyle(sourceWindow.getComputedStyle(sourceNode)));
      return image;
    }

    if (sourceNode instanceof sourceWindow.HTMLVideoElement) {
      if (sourceNode.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null;
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = Math.max(1, sourceNode.videoWidth || Math.round(sourceNode.clientWidth) || 1);
      frameCanvas.height = Math.max(1, sourceNode.videoHeight || Math.round(sourceNode.clientHeight) || 1);
      const frameContext = frameCanvas.getContext('2d');
      if (!frameContext) return null;
      frameContext.drawImage(sourceNode, 0, 0, frameCanvas.width, frameCanvas.height);
      const image = snapshotDocument.createElementNS(xhtmlNamespace, 'img');
      image.setAttribute('src', frameCanvas.toDataURL('image/png'));
      image.setAttribute('style', serializeComputedStyle(sourceWindow.getComputedStyle(sourceNode)));
      return image;
    }

    const namespace = sourceNode.namespaceURI === svgNamespace ? svgNamespace : xhtmlNamespace;
    const tagName = namespace === svgNamespace ? sourceNode.tagName : sourceNode.tagName.toLowerCase();
    const clone = snapshotDocument.createElementNS(namespace, tagName);

    Array.from(sourceNode.attributes).forEach((attribute) => {
      if (attribute.name === 'style') return;
      let value = attribute.value;
      if ((attribute.name === 'src' || attribute.name === 'href') && value && !value.startsWith('data:')) {
        try {
          value = new URL(value, sourceWindow.location.href).href;
        } catch {
          // keep the original value if URL resolution fails
        }
      }
      clone.setAttribute(attribute.name, value);
    });

    const computedStyle = sourceWindow.getComputedStyle(sourceNode);
    const inlineStyle = serializeComputedStyle(computedStyle);
    if (inlineStyle) {
      clone.setAttribute('style', inlineStyle);
    }

    if (sourceNode instanceof sourceWindow.HTMLImageElement && sourceNode.currentSrc) {
      clone.setAttribute('src', sourceNode.currentSrc);
    }

    if (sourceNode instanceof sourceWindow.HTMLInputElement) {
      clone.setAttribute('value', sourceNode.value);
    }

    if (sourceNode instanceof sourceWindow.HTMLTextAreaElement) {
      clone.textContent = sourceNode.value;
    }

    sourceNode.childNodes.forEach((childNode) => {
      const childClone = clonePresentationNode(childNode, snapshotDocument, sourceWindow);
      if (childClone) {
        clone.appendChild(childClone);
      }
    });

    return clone;
  };

  const buildPresentationSnapshotSvg = () => {
    if (stage.dataset.layout !== 'presentation') return null;
    if (presentationFrame.hidden || !presentation.getHref()) return null;

    const frameWindow = presentationFrame.contentWindow;
    const frameDocument = frameWindow?.document;
    if (!frameWindow || !frameDocument) return null;

    const revealRoot =
      frameDocument.querySelector('.reveal-viewport') || frameDocument.querySelector('.reveal');
    if (!(revealRoot instanceof frameWindow.HTMLElement)) return null;

    const width = Math.max(
      2,
      Math.round(revealRoot.clientWidth || frameDocument.documentElement.clientWidth || presentationFrame.clientWidth),
    );
    const height = Math.max(
      2,
      Math.round(revealRoot.clientHeight || frameDocument.documentElement.clientHeight || presentationFrame.clientHeight),
    );

    const snapshotDocument = document.implementation.createHTMLDocument('presentation-snapshot');
    const wrapper = snapshotDocument.createElementNS('http://www.w3.org/1999/xhtml', 'div');
    wrapper.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    wrapper.setAttribute(
      'style',
      `${serializeComputedStyle(frameWindow.getComputedStyle(revealRoot))};position:relative;overflow:hidden;width:${width}px;height:${height}px;background:#000;`,
    );

    const revealClone = clonePresentationNode(revealRoot, snapshotDocument, frameWindow);
    if (revealClone) {
      wrapper.appendChild(revealClone);
    }

    const xhtml = new XMLSerializer().serializeToString(wrapper);
    const svgMarkup =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<foreignObject width="100%" height="100%">${xhtml}</foreignObject>` +
      '</svg>';

    return {
      svgMarkup,
      width,
      height,
    };
  };

  const refreshRecordingPresentationSnapshot = async (force = false) => {
    if (recordingPresentationSnapshotTask) return recordingPresentationSnapshotTask;
    if (!force && Date.now() - recordingPresentationLastSnapshotAt < 400) return;

    recordingPresentationSnapshotTask = (async () => {
      const snapshot = buildPresentationSnapshotSvg();
      if (!snapshot) {
        if (recordingPresentationUrl) {
          URL.revokeObjectURL(recordingPresentationUrl);
          recordingPresentationUrl = '';
        }
        recordingPresentationImage = null;
        recordingPresentationLastSnapshotAt = 0;
        return;
      }

      recordingPresentationLastSnapshotAt = Date.now();

      const url = URL.createObjectURL(
        new Blob([snapshot.svgMarkup], {
          type: 'image/svg+xml;charset=utf-8',
        }),
      );

      try {
        const image = new Image();
        image.decoding = 'async';

        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error('Could not load the presentation snapshot.'));
          image.src = url;
        });

        if (recordingPresentationUrl) {
          URL.revokeObjectURL(recordingPresentationUrl);
        }

        recordingPresentationUrl = url;
        recordingPresentationImage = image;
      } catch {
        URL.revokeObjectURL(url);
      }
    })().finally(() => {
      recordingPresentationSnapshotTask = null;
    });

    return recordingPresentationSnapshotTask;
  };

  const createCompatibleMediaRecorder = (
    stream: MediaStream,
  ): {
    recorder: MediaRecorder;
    mimeType: string;
  } => {
    const candidates = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=h264,aac',
      'video/mp4',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
      '',
    ];

    for (const mimeType of candidates) {
      if (mimeType && !MediaRecorder.isTypeSupported(mimeType)) {
        continue;
      }

      try {
        const recorderOptions: MediaRecorderOptions & {
          audioBitrateMode?: 'constant' | 'variable';
        } = {
          audioBitsPerSecond: 320_000,
          videoBitsPerSecond: 12_000_000,
        };

        recorderOptions.audioBitrateMode = 'constant';

        if (mimeType) {
          recorderOptions.mimeType = mimeType;
        }

        return {
          recorder: new MediaRecorder(stream, recorderOptions),
          mimeType,
        };
      } catch {
        // Try the next candidate.
      }
    }

    throw new Error('This browser could not initialize a supported recorder.');
  };

  const drawRecordingFrame = () => {
    if (!recordingCanvas || !recordingCanvasContext) return;

    const viewportRect = getRecordingViewportRect();
    const width = Math.max(2, Math.round(viewportRect.width));
    const height = Math.max(2, Math.round(viewportRect.height));

    if (recordingCanvas.width !== width || recordingCanvas.height !== height) {
      recordingCanvas.width = width;
      recordingCanvas.height = height;
    }

    recordingCanvasContext.clearRect(0, 0, width, height);
    recordingCanvasContext.fillStyle = '#000';
    recordingCanvasContext.fillRect(0, 0, width, height);

    if (
      recordingDisplayVideo &&
      recordingDisplayVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      recordingDisplayVideo.videoWidth > 2 &&
      recordingDisplayVideo.videoHeight > 2
    ) {
      const { sx, sy, sw, sh } = getRecordingViewportSourceRect(recordingDisplayVideo);
      recordingCanvasContext.drawImage(
        recordingDisplayVideo,
        sx,
        sy,
        Math.min(sw, recordingDisplayVideo.videoWidth - sx),
        Math.min(sh, recordingDisplayVideo.videoHeight - sy),
        0,
        0,
        width,
        height,
      );
      recordingAnimationId = window.requestAnimationFrame(drawRecordingFrame);
      return;
    }

    if (stage.dataset.layout === 'presentation' && !presentationFrame.hidden) {
      if (
        !recordingPresentationSnapshotTask &&
        Date.now() - recordingPresentationLastSnapshotAt > 500
      ) {
        void refreshRecordingPresentationSnapshot(false);
      }

      const presentationRect = presentationFrame.getBoundingClientRect();
      if (
        recordingPresentationImage &&
        presentationRect.width > 2 &&
        presentationRect.height > 2
      ) {
        const localRect = new DOMRect(
          presentationRect.left - viewportRect.left,
          presentationRect.top - viewportRect.top,
          presentationRect.width,
          presentationRect.height,
        );

        recordingCanvasContext.drawImage(
          recordingPresentationImage,
          localRect.x,
          localRect.y,
          localRect.width,
          localRect.height,
        );
      }
    }

    getVisibleVideoElements().forEach((video) => {
      const rect = video.getBoundingClientRect();
      const localRect = new DOMRect(
        rect.left - viewportRect.left,
        rect.top - viewportRect.top,
        rect.width,
        rect.height,
      );

      recordingCanvasContext.save();

      if (isPresentationCircleVideo(video)) {
        const radius = Math.min(localRect.width, localRect.height) / 2;
        recordingCanvasContext.beginPath();
        recordingCanvasContext.arc(
          localRect.x + localRect.width / 2,
          localRect.y + localRect.height / 2,
          radius,
          0,
          Math.PI * 2,
        );
        recordingCanvasContext.clip();
      }

      drawVideoIntoRect({
        context: recordingCanvasContext,
        fit:
          video.closest('.conference-media-frame--screen') ||
          video.closest('.conference-stage-panel--screen')
            ? 'contain'
            : 'cover',
        offsetY: isPresentationCircleVideo(video) || isSelfPreviewVideo(video) ? 0.42 : 0.5,
        rect: localRect,
        video,
      });

      recordingCanvasContext.restore();
    });

    recordingAnimationId = window.requestAnimationFrame(drawRecordingFrame);
  };

  const buildRecordingAudioTrack = async () => {
    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextCtor) return null;

    const audioContext = new AudioContextCtor({ sampleRate: 48_000 });
    recordingAudioContext = audioContext;
    await audioContext.resume().catch(() => undefined);

    const destination = audioContext.createMediaStreamDestination();
    const seenTrackIds = new Set<string>();
    let hasAudio = false;

    const connectTrack = (track: MediaStreamTrack) => {
      if (track.kind !== 'audio' || track.readyState !== 'live') return;

      const clone = track.clone();
      clone.enabled = true;
      recordingMicTrackClones.push(clone);

      const source = audioContext.createMediaStreamSource(new MediaStream([clone]));
      const gain = audioContext.createGain();
      gain.gain.value = 1;
      source.connect(gain);
      gain.connect(destination);

      recordingMediaElementSources.push(source, gain);
      hasAudio = true;
    };

    const connectMediaElement = (element: HTMLMediaElement) => {
      try {
        const source = audioContext.createMediaElementSource(element);
        const gain = audioContext.createGain();
        gain.gain.value = 1;
        source.connect(gain);
        gain.connect(destination);
        recordingMediaElementSources.push(source, gain);
        hasAudio = true;
      } catch {
        // ignore duplicate or unsupported media element sources
      }
    };

    Array.from(mounts.participantAudioMounts.values()).forEach((mount) => {
      if (mount.element instanceof HTMLMediaElement) {
        connectMediaElement(mount.element);
      }
    });

    Array.from(mounts.screenAudioMounts.values()).forEach((mount) => {
      if (mount.element instanceof HTMLMediaElement) {
        connectMediaElement(mount.element);
      }
    });

    Array.from(room.localParticipant.audioTrackPublications.values()).forEach((publication) => {
      const mediaStreamTrack = (
        publication.track as { mediaStreamTrack?: MediaStreamTrack } | undefined
      )?.mediaStreamTrack;

      if (!mediaStreamTrack || mediaStreamTrack.readyState !== 'live') return;
      if (
        publication.source === Track.Source.Microphone &&
        !room.localParticipant.isMicrophoneEnabled
      ) {
        return;
      }
      if (
        publication.source === Track.Source.ScreenShareAudio &&
        !room.localParticipant.isScreenShareEnabled
      ) {
        return;
      }

      const trackKey = `${room.localParticipant.identity}:${publication.source}:${mediaStreamTrack.id}`;
      if (seenTrackIds.has(trackKey)) return;
      seenTrackIds.add(trackKey);
      connectTrack(mediaStreamTrack);
    });

    return hasAudio ? destination.stream.getAudioTracks()[0] || null : null;
  };

  const startRecording = async () => {
    if (!(recordButton instanceof HTMLButtonElement)) return;
    if (room.state !== ConnectionState.Connected) return;
    if (typeof MediaRecorder === 'undefined') {
      throw new Error('MediaRecorder is not available in this browser.');
    }
    recordingCanvas = document.createElement('canvas');
    recordingCanvasContext = recordingCanvas.getContext('2d', { alpha: false });
    if (!recordingCanvasContext) {
      throw new Error('Could not initialize the recording canvas.');
    }
    recordingCanvasContext.imageSmoothingEnabled = true;
    recordingCanvasContext.imageSmoothingQuality = 'high';

    let usingDisplayCapture = false;
    try {
      setStatus('Selecciona esta pestaña en el dialogo de captura para grabar el stage.');
      usingDisplayCapture = await startRecordingDisplayCapture();
    } catch (error) {
      console.warn('Recording display capture failed, falling back to DOM compositor.', error);
    }

    if (!usingDisplayCapture) {
      await refreshRecordingPresentationSnapshot(true).catch(() => undefined);
    }
    drawRecordingFrame();

    const canvasStream = recordingCanvas.captureStream(30);
    const mixedAudioTrack = await buildRecordingAudioTrack();
    const stream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...(mixedAudioTrack ? [mixedAudioTrack] : []),
    ]);

    const { recorder, mimeType } = createCompatibleMediaRecorder(stream);
    recordingStream = stream;
    recordingChunks = [];
    mediaRecorder = recorder;

    recorder.addEventListener('dataavailable', (event) => {
      if (event.data && event.data.size > 0) {
        recordingChunks.push(event.data);
      }
    });

    recorder.addEventListener('stop', () => {
      const nextChunks = [...recordingChunks];
      cleanupRecording();
      if (nextChunks.length === 0) return;
      downloadRecording(new Blob(nextChunks, { type: mimeType || 'video/webm' }));
      setStatus('Grabacion guardada.');
    });

    recorder.start(250);
    recordingDataRequestId = window.setInterval(() => {
      if (mediaRecorder?.state === 'recording') {
        mediaRecorder.requestData();
      }
    }, 1000);
    setRecordState(true);
    setStatus(
      usingDisplayCapture
        ? mimeType.includes('mp4')
          ? 'Grabacion MP4 iniciada con captura de la pestaña.'
          : 'Grabacion iniciada con captura de la pestaña en WebM.'
        : mimeType.includes('mp4')
          ? 'Grabacion MP4 iniciada.'
          : 'Grabacion iniciada en WebM. MP4 no esta disponible en este navegador.',
    );
  };

  const chooseFocusParticipantIdentity = () => {
    const liveSpeakers = room.activeSpeakers.filter(hasCameraTrack);
    if (liveSpeakers[0]) {
      return liveSpeakers[0].identity;
    }

    const teacherParticipant = allParticipants().find(
      (participant) => readParticipantRole(room, participant, localRole) === 'teacher' && hasCameraTrack(participant),
    );
    if (teacherParticipant) {
      return teacherParticipant.identity;
    }

    const firstParticipantWithCamera = allParticipants().find(hasCameraTrack);
    return firstParticipantWithCamera?.identity || '';
  };

  const refreshFocusIdentity = () => {
    focusedParticipantIdentity = chooseFocusParticipantIdentity();
  };

  const hasActiveScreenShare = () =>
    allParticipants().some((participant) =>
      Array.from(participant.videoTrackPublications.values()).some(
        (entry) => entry.track && entry.source === Track.Source.ScreenShare,
      ),
    );

  const syncScreenshareLayout = () => {
    const hasScreenshare = hasActiveScreenShare();
    const currentLayout = normalizeLayoutMode(layoutInput.value);

    if (hasScreenshare) {
      if (!autoSwitchedToScreenshare && currentLayout !== 'screenshare') {
        if (currentLayout !== 'screenshare') {
          layoutBeforeAutoScreenshare = currentLayout;
        }
        layoutInput.value = setLayout(stage, 'screenshare');
        autoSwitchedToScreenshare = true;
        writeQueryState();
        syncLayoutChoiceButtons();
      }
      return;
    }

    if (autoSwitchedToScreenshare && currentLayout === 'screenshare') {
      layoutInput.value = setLayout(stage, layoutBeforeAutoScreenshare);
      writeQueryState();
    }

    autoSwitchedToScreenshare = false;
    syncLayoutChoiceButtons();
  };

  const canChangeLayoutLocally = () => !hasActiveScreenShare();

  const resolveParticipantTargetSlot = (participant: Participant): HTMLElement | null => {
    const layout = getCurrentLayout();
    const role = readParticipantRole(room, participant, localRole);
    const isLocal = isLocalParticipant(room, participant);

    if (layout === 'grid') {
      return gridSlot;
    }

    if (layout === 'teacher') {
      if (participant.identity === focusedParticipantIdentity) {
        return teacherSlot;
      }
      return isLocal ? null : studentsSlot;
    }

    if (layout === 'presentation') {
      if (role === 'teacher') {
        return teacherSlot;
      }
      return isLocal ? null : studentsSlot;
    }

    return isLocal ? null : studentsSlot;
  };

  const clearIdentityPreviewSlot = () => {
    if (identityPreviewSlot instanceof HTMLElement) {
      identityPreviewSlot.innerHTML = '';
    }
  };

  const removeLocalPreviewStream = () => {
    if (!localPreviewStreamMount) return;
    localPreviewStreamMount.stream.getTracks().forEach((track) => track.stop());
    localPreviewStreamMount.element.srcObject = null;
    localPreviewStreamMount.wrapper.remove();
    localPreviewStreamMount = null;
  };

  const mountLocalPreviewStream = (stream: MediaStream) => {
    if (!(identityPreviewSlot instanceof HTMLElement)) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    removeMount(localPreviewMount ?? undefined);
    localPreviewMount = null;
    removeLocalPreviewStream();
    clearIdentityPreviewSlot();

    const wrapper = document.createElement('div');
    wrapper.className = 'conference-media-frame conference-media-frame--local-preview';

    if (previewBlur) {
      appendBlurBackdrop({
        stream,
        wrapper,
      });
    }

    const element = document.createElement('video');
    element.autoplay = true;
    element.muted = true;
    element.playsInline = true;
    element.srcObject = stream;
    wrapper.appendChild(element);
    identityPreviewSlot.appendChild(wrapper);
    void element.play().catch(() => undefined);

    const settings = stream.getVideoTracks()[0]?.getSettings?.();
    const deviceId = normalizeText(settings?.deviceId) || preferredVideoInputId;

    localPreviewStreamMount = {
      deviceId,
      element,
      stream,
      wrapper,
    };
  };

  const enableDisconnectedCameraPreview = async () => {
    if (room.state !== ConnectionState.Disconnected) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera preview is not available in this browser.');
    }

    const requestedDeviceId = normalizeText(preferredVideoInputId);
    const currentDeviceId = normalizeText(localPreviewStreamMount?.deviceId);
    const currentTrack = localPreviewStreamMount?.stream.getVideoTracks()[0];
    if (
      disconnectedCameraPreviewEnabled &&
      localPreviewStreamMount &&
      currentTrack?.readyState === 'live' &&
      (!requestedDeviceId || requestedDeviceId === currentDeviceId)
    ) {
      return;
    }

    const exactConstraints =
      requestedDeviceId
        ? ({ video: { deviceId: { exact: requestedDeviceId } }, audio: false } satisfies MediaStreamConstraints)
        : ({ video: true, audio: false } satisfies MediaStreamConstraints);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(exactConstraints);
    } catch (error) {
      if (!requestedDeviceId) throw error;
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }

    disconnectedCameraPreviewEnabled = true;
    mountLocalPreviewStream(stream);
    await refreshDeviceOptions(true);
  };

  const disableDisconnectedCameraPreview = () => {
    disconnectedCameraPreviewEnabled = false;
    removeLocalPreviewStream();
    if (room.state === ConnectionState.Disconnected) {
      clearIdentityPreviewSlot();
    }
  };

  const syncIdentityPreview = () => {
    if (!(identityPreviewSlot instanceof HTMLElement)) {
      removeMount(localPreviewMount ?? undefined);
      localPreviewMount = null;
      removeLocalPreviewStream();
      return;
    }

    if (room.state === ConnectionState.Disconnected) {
      removeMount(localPreviewMount ?? undefined);
      localPreviewMount = null;
      if (!disconnectedCameraPreviewEnabled) {
        removeLocalPreviewStream();
        clearIdentityPreviewSlot();
      }
      return;
    }

    removeLocalPreviewStream();

    const publication = Array.from(room.localParticipant.videoTrackPublications.values()).find(
      (entry) => entry.track && entry.source !== Track.Source.ScreenShare,
    );

    if (!publication?.track) {
      removeMount(localPreviewMount ?? undefined);
      localPreviewMount = null;
      clearIdentityPreviewSlot();
      return;
    }

    const trackSid = getTrackSid(publication);
    const shouldRenderBackdrop = Boolean(
      previewBlur &&
        !isBackgroundBlurProcessorActive(isLocalCameraTrackLike(publication.track) ? publication.track : null),
    );
    if (
      localPreviewMount &&
      localPreviewMount.trackSid === trackSid &&
      localPreviewMount.track === publication.track &&
      shouldRenderBackdrop === Boolean(localPreviewMount.wrapper.querySelector('.conference-media-backdrop'))
    ) {
      return;
    }

    removeMount(localPreviewMount ?? undefined);
    clearIdentityPreviewSlot();

    const wrapper = document.createElement('div');
    wrapper.className = 'conference-media-frame conference-media-frame--local-preview';

    if (shouldRenderBackdrop) {
      appendBlurBackdrop({
        track: (
          publication.track as { mediaStreamTrack?: MediaStreamTrack | null } | undefined
        )?.mediaStreamTrack,
        wrapper,
      });
    }

    const element = createMediaElement(publication.track, true);
    wrapper.appendChild(element);
    identityPreviewSlot.appendChild(wrapper);
    publication.track.attach(element);

    localPreviewMount = {
      element,
      track: publication.track,
      trackSid,
      wrapper,
    };
  };

  const postToPresentation = (payload: Record<string, unknown>) => {
    if (!presentationFrame.contentWindow || presentationFrame.hidden) return;
    presentationFrame.contentWindow.postMessage(payload, window.location.origin);
  };

  const requestPresentationState = () => {
    postToPresentation({ type: 'musiki:reveal-request-state' });
  };

  const resetPresentationZoom = () => {
    postToPresentation({ type: 'musiki:reveal-reset-zoom' });
  };

  const applyRemoteSlideState = (slideState: SlideState) => {
    pendingRemoteSlideState = slideState;
    postToPresentation({
      type: 'musiki:reveal-goto',
      state: slideState,
    });
  };

  const publishSlideState = async (slideState: SlideState) => {
    if (localRole !== 'teacher' || room.state !== ConnectionState.Connected) return;
    const slideKey = `${slideState.indexh}:${slideState.indexv}:${slideState.indexf}:${slideState.zoom.toFixed(3)}`;
    if (slideKey === lastPublishedSlideKey) return;
    lastPublishedSlideKey = slideKey;
    await publishMessage({
      type: 'slide-state',
      ...slideState,
    });
  };

  const handlePresentationMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    if (event.source !== presentationFrame.contentWindow) return;

    const payload = event.data;
    if (!payload || typeof payload !== 'object') return;

    const type = normalizeText((payload as { type?: string }).type);
    if (type === 'musiki:reveal-ready') {
      if (pendingRemoteSlideState) {
        applyRemoteSlideState(pendingRemoteSlideState);
      } else if (localRole === 'teacher') {
        requestPresentationState();
      }
      return;
    }

    if (type !== 'musiki:reveal-slide-state') return;
    const slideState = normalizeSlideState((payload as { state?: SlideState }).state);
    if (!slideState) return;
    currentSlideState = slideState;
    if (localRole === 'teacher') {
      void publishSlideState(slideState);
    }
  };

  const syncLiveActivityTransport = () => {
    unsubscribeLiveActivity?.();
    unsubscribeLiveActivity = null;

    const effectiveCourseId = getEffectiveCourseId();

    if (!effectiveCourseId) {
      activeLiveSnapshot = null;
      postToPresentation({ type: 'musiki:live-snapshot', snapshot: null });
      renderLiveActivity();
      return;
    }

    unsubscribeLiveActivity = subscribeToLive({
      courseId: effectiveCourseId,
      onEvent: (eventName, payload) => {
        if (eventName === 'live.ended') {
          const endedSessionId = normalizeText((payload as LiveSnapshot | null)?.sessionId);
          if (!endedSessionId || endedSessionId === normalizeText(activeLiveSnapshot?.sessionId)) {
            activeLiveSnapshot = null;
          }
          postToPresentation({ type: 'musiki:live-snapshot', snapshot: null });
          renderLiveActivity();
          return;
        }

        activeLiveSnapshot = payload && typeof payload === 'object' ? (payload as LiveSnapshot) : null;
        postToPresentation({ type: 'musiki:live-snapshot', snapshot: activeLiveSnapshot });
        renderLiveActivity();
      },
    });
  };

  const readMessage = (payload: Uint8Array): ConferenceMessage | null => {
    try {
      const parsed = JSON.parse(textDecoder.decode(payload));
      if (!parsed || typeof parsed !== 'object' || typeof parsed.type !== 'string') {
        return null;
      }

      if (parsed.type === 'layout') {
        return {
          type: 'layout',
          layout: normalizeLayoutMode((parsed as { layout?: string }).layout),
        };
      }

      if (parsed.type === 'presentation') {
        return {
          type: 'presentation',
          href: typeof (parsed as { href?: string | null }).href === 'string'
            ? (parsed as { href: string }).href
            : null,
        };
      }

      if (parsed.type === 'session-setup') {
        return {
          type: 'session-setup',
          previewZoom: normalizePreviewZoom((parsed as { previewZoom?: number }).previewZoom, 1),
          showCircle: Boolean((parsed as { showCircle?: boolean }).showCircle),
        };
      }

      if (parsed.type === 'slide-state') {
        const slideState = normalizeSlideState(parsed as Partial<SlideState>);
        if (!slideState) return null;
        return {
          type: 'slide-state',
          ...slideState,
        };
      }

      if (parsed.type === 'chat') {
        const text = normalizeText((parsed as { text?: string }).text);
        const id = normalizeText((parsed as { id?: string }).id);
        if (!text || !id) return null;

        return {
          type: 'chat',
          id,
          identity: normalizeText((parsed as { identity?: string }).identity),
          name: normalizeText((parsed as { name?: string }).name) || 'Participant',
          role: normalizeRole((parsed as { role?: string }).role),
          sentAt:
            normalizeText((parsed as { sentAt?: string }).sentAt) || new Date().toISOString(),
          text,
        };
      }

      return null;
    } catch {
      return null;
    }
  };

  const writeQueryState = () => {
    const params = new URLSearchParams(window.location.search);
    const effectiveCourseId = getEffectiveCourseId();
    if (effectiveCourseId) {
      params.set('course', effectiveCourseId);
    } else {
      params.delete('course');
    }
    params.set('room', roomInput.value.trim());
    params.set('identity', identityInput.value.trim());
    if (nameInput.value.trim()) {
      params.set('name', nameInput.value.trim());
    } else {
      params.delete('name');
    }

    const selectedPresentationHref = normalizeText(presentationSelect.value) || presentation.getHref();
    const presentationHref = normalizeText(selectedPresentationHref);
    if (presentationHref) {
      params.set('slides', presentationHref);
    } else {
      params.delete('slides');
    }

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;
    window.history.replaceState({}, '', nextUrl);
  };

  const publishMessage = async (message: ConferenceMessage) => {
    if (room.state !== ConnectionState.Connected || !room.localParticipant) return;

    await room.localParticipant.publishData(textEncoder.encode(JSON.stringify(message)), {
      reliable: true,
      topic: MESSAGE_TOPIC,
    });
  };

  const publishTeacherState = async () => {
    if (localRole !== 'teacher' || room.state !== ConnectionState.Connected) return;

    await publishMessage({
      type: 'layout',
      layout: getCurrentLayout(),
    });

    await publishMessage({
      type: 'presentation',
      href: presentation.getHref(),
    });

    await publishMessage({
      type: 'session-setup',
      previewZoom,
      showCircle: showPresentationCircle,
    });

    if (currentSlideState) {
      await publishSlideState(currentSlideState);
    }
  };

  const syncPresentationSelection = (href: string | null) => {
    if (href && Array.from(presentationSelect.options).some((option) => option.value === href)) {
      presentationSelect.value = href;
      return;
    }
    presentationSelect.value = '';
  };

  const refreshDeviceOptions = async (requestPermissions = false) => {
    const deviceTasks: Promise<void>[] = [];

    if (audioInputSelects.length > 0) {
      deviceTasks.push(
        Room.getLocalDevices('audioinput', requestPermissions)
          .then((devices) => {
            audioInputSelects.forEach((select) => {
              populateDeviceSelect({
                activeDeviceId: room.getActiveDevice('audioinput') || preferredAudioInputId,
                devices,
                emptyLabel: 'No se detectaron microfonos',
                kind: 'audioinput',
                select,
              });
            });
          })
          .catch(() => {
            audioInputSelects.forEach((select) => {
              populateDeviceSelect({
                devices: [],
                emptyLabel: 'No se detectaron microfonos',
                kind: 'audioinput',
                select,
              });
            });
          }),
      );
    }

    if (videoInputSelects.length > 0) {
      deviceTasks.push(
        Room.getLocalDevices('videoinput', requestPermissions)
          .then((devices) => {
            videoInputSelects.forEach((select) => {
              populateDeviceSelect({
                activeDeviceId: room.getActiveDevice('videoinput') || preferredVideoInputId,
                devices,
                emptyLabel: 'No se detectaron camaras',
                kind: 'videoinput',
                select,
              });
            });
          })
          .catch(() => {
            videoInputSelects.forEach((select) => {
              populateDeviceSelect({
                devices: [],
                emptyLabel: 'No se detectaron camaras',
                kind: 'videoinput',
                select,
              });
            });
          }),
      );
    }

    await Promise.all(deviceTasks);
    setControlState();
  };

  const schedulePresentationLoad = ({
    broadcast = false,
    href,
    successMessage,
  }: {
    broadcast?: boolean;
    href: string | null;
    successMessage: string;
  }) => {
    if (pendingPresentationTask) {
      window.clearTimeout(pendingPresentationTask);
      pendingPresentationTask = 0;
    }

    const nextHref = normalizeText(href) || null;
    if (nextHref) {
      setStatus('Cargando escena Reveal...');
    }

    pendingPresentationTask = window.setTimeout(() => {
      pendingPresentationTask = 0;

      try {
        if (nextHref) {
          const committedHref = presentation.setHref(nextHref);
          syncPresentationSelection(committedHref);
          currentSlideState = null;
          pendingRemoteSlideState = null;
          lastPublishedSlideKey = '';
        } else {
          presentation.clear();
          syncPresentationSelection(null);
          currentSlideState = null;
          pendingRemoteSlideState = null;
          lastPublishedSlideKey = '';
        }

        writeQueryState();
        syncLiveActivityTransport();
        void syncLocalParticipantMetadata().catch(() => undefined);
        renderLiveActivity();
        setStatus(successMessage);

        if (broadcast && room.state === ConnectionState.Connected && localRole === 'teacher') {
          void publishMessage({
            type: 'presentation',
            href: nextHref,
          });
        }
      } catch (error) {
        setStatus(safeErrorMessage(error));
      }
    }, nextHref ? 48 : 0);
  };

  const renderChat = () => {
    chatList.innerHTML = '';
    chatDownloadButton.disabled = chatMessages.length === 0;

    if (chatMessages.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'conference-chat-empty';
      empty.textContent = 'No hay mensajes todavia.';
      chatList.appendChild(empty);
      return;
    }

    chatMessages.slice(-60).forEach((message) => {
      const item = document.createElement('li');
      item.className = 'conference-chat-item';

      const header = document.createElement('div');
      header.className = 'conference-chat-header';

      const sender = document.createElement('span');
      sender.className = 'conference-chat-author';
      sender.textContent = message.name;

      const body = document.createElement('div');
      body.className = 'conference-chat-text';
      body.textContent = message.text;

      const separator = document.createElement('span');
      separator.className = 'conference-chat-header-separator';
      separator.textContent = '·';

      const sentAt = document.createElement('time');
      sentAt.className = 'conference-chat-stamp';
      sentAt.dateTime = message.sentAt;
      sentAt.textContent = new Date(message.sentAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      header.append(sender, separator, sentAt);
      item.append(header, body);
      chatList.appendChild(item);
    });

    chatList.scrollTop = chatList.scrollHeight;
  };

  const downloadChatTranscript = () => {
    if (chatMessages.length === 0) return;

    const roomName = normalizeText(roomInput.value) || 'room';
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const lines = chatMessages.map((message) => {
      const timeLabel = new Date(message.sentAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      return `${message.name} ${timeLabel}\n${message.text}\n`;
    });

    const blob = new Blob([lines.join('\n')], {
      type: 'text/plain;charset=utf-8',
    });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `${roomName}-chat-${stamp}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => {
      URL.revokeObjectURL(href);
    }, 1000);
  };

  const appendChatMessage = (message: Extract<ConferenceMessage, { type: 'chat' }>) => {
    if (chatMessages.some((entry) => entry.id === message.id)) return;
    chatMessages.push(message);
    if (chatMessages.length > 80) {
      chatMessages.splice(0, chatMessages.length - 80);
    }
    renderChat();
  };

  const setControlState = () => {
    const connected = room.state === ConnectionState.Connected;
    const connecting =
      room.state === ConnectionState.Connecting ||
      room.state === ConnectionState.Reconnecting ||
      room.state === ConnectionState.SignalReconnecting;
    const livekitReady = true;

    stateNode.textContent = connectionStateLabel(room.state);
    const participantCount = room.remoteParticipants.size + (connected ? 1 : 0);
    countNode.textContent = countNode.dataset.compact === 'true'
      ? String(participantCount)
      : `${participantCount} participantes`;

    if (connectButton instanceof HTMLButtonElement) {
      connectButton.disabled = !livekitReady || connected || connecting;
    }
    if (disconnectButton instanceof HTMLButtonElement) {
      disconnectButton.disabled = !connected && !connecting;
    }
    if (connectToggleButton instanceof HTMLButtonElement) {
      connectToggleButton.disabled = !livekitReady || connecting;
      connectToggleButton.dataset.connected = connected ? 'true' : 'false';
      connectToggleButton.dataset.connecting = connecting ? 'true' : 'false';
      connectToggleButton.setAttribute(
        'aria-label',
        connected ? 'Desconectar de la sala' : connecting ? 'Conectando...' : 'Conectar a la sala',
      );
      connectToggleButton.title = connected
        ? 'Desconectar'
        : connecting
          ? 'Conectando...'
          : 'Conectar';
    }
    cameraButton.disabled = connecting;
    microphoneButton.disabled = connecting;
    shareScreenButton.disabled = !connected;
    if (recordButton instanceof HTMLButtonElement) {
      recordButton.disabled = !connected;
    }
    layoutInput.disabled = !canChangeLayoutLocally();
    presentationSelect.disabled = connected && localRole !== 'teacher';
    if (presentationButton instanceof HTMLButtonElement) {
      presentationButton.disabled = connected && localRole !== 'teacher';
    }
    const hasAudioChoices = audioInputSelects.some((select) =>
      Array.from(select.options).some((option) => option.value),
    );
    audioInputSelects.forEach((select) => {
      select.disabled = !hasAudioChoices;
    });
    const hasVideoChoices = videoInputSelects.some((select) =>
      Array.from(select.options).some((option) => option.value),
    );
    videoInputSelects.forEach((select) => {
      select.disabled = !hasVideoChoices;
    });
    if (presentationClearButton instanceof HTMLButtonElement) {
      presentationClearButton.disabled =
        (connected && localRole !== 'teacher') ||
        (!presentation.getHref() && !normalizeText(presentationSelect.value));
    }
    chatInput.disabled = !connected;
    chatSendButton.disabled = !connected;
    chatDownloadButton.disabled = chatMessages.length === 0;
    if (raiseHandButton instanceof HTMLButtonElement) {
      raiseHandButton.disabled = !connected;
    }
    if (instrumentsToggleButton instanceof HTMLButtonElement) {
      instrumentsToggleButton.dataset.active = instrumentsOpen ? 'true' : 'false';
      instrumentsToggleButton.setAttribute('aria-pressed', instrumentsOpen ? 'true' : 'false');
    }
    roomInput.disabled = connected || connecting;
    identityInput.disabled = connected || connecting;
    nameInput.disabled = connected || connecting;

    const cameraEnabled = connected && room.localParticipant.isCameraEnabled;
    const previewEnabled = !connected && disconnectedCameraPreviewEnabled;
    const microphoneEnabled = connected && room.localParticipant.isMicrophoneEnabled;
    const shareEnabled = connected && room.localParticipant.isScreenShareEnabled;

    cameraButton.dataset.enabled = cameraEnabled || previewEnabled ? 'true' : 'false';
    cameraButton.dataset.open = activeDevicePanel === 'video' ? 'true' : 'false';
    cameraButton.setAttribute(
      'aria-label',
      cameraEnabled || previewEnabled ? 'Apagar camara' : 'Encender camara',
    );
    cameraButton.title = cameraEnabled || previewEnabled
      ? connected
        ? 'Apagar camara. Shift + click para elegir dispositivo.'
        : 'Cerrar preview de camara. Shift + click para elegir dispositivo.'
      : connected
        ? 'Encender camara. Shift + click para elegir dispositivo.'
        : 'Abrir preview de camara. Shift + click para elegir dispositivo.';

    microphoneButton.dataset.enabled = microphoneEnabled ? 'true' : 'false';
    microphoneButton.dataset.open = activeDevicePanel === 'audio' ? 'true' : 'false';
    microphoneButton.setAttribute(
      'aria-label',
      microphoneEnabled ? 'Silenciar microfono' : 'Activar microfono',
    );
    microphoneButton.title = microphoneEnabled
      ? 'Silenciar microfono. Shift + click para elegir dispositivo.'
      : 'Activar microfono. Shift + click para elegir dispositivo.';

    shareScreenButton.dataset.enabled = shareEnabled ? 'true' : 'false';
    shareScreenButton.setAttribute(
      'aria-label',
      shareEnabled ? 'Detener pantalla compartida' : 'Compartir pantalla',
    );
    shareScreenButton.title = shareEnabled ? 'Detener pantalla' : 'Compartir pantalla';
    syncLayoutChoiceButtons();
    renderLiveActivity();
    renderSessionTimer();
    setRecordState(Boolean(mediaRecorder && mediaRecorder.state !== 'inactive'));
    syncMicMeter();
    syncRaiseHandUi();
    syncFullscreenButton();
  };

  const ensureParticipantCard = (participant: Participant) => {
    const identity = participant.identity;
    const role = readParticipantRole(room, participant, localRole);
    const targetSlot = resolveParticipantTargetSlot(participant);

    if (!(targetSlot instanceof HTMLElement)) {
      removeParticipant(identity);
      return null;
    }

    let card = participantCards.get(identity);
    if (!card) {
      const node = cloneTemplate(participantTemplate);
      const media = node.querySelector('[data-card-media]');
      const name = node.querySelector('[data-card-name]');
      const placeholder = node.querySelector('[data-card-placeholder]');
      const hand = node.querySelector('[data-card-hand]');

      if (
        !(media instanceof HTMLElement) ||
        !(name instanceof HTMLElement) ||
        !(placeholder instanceof HTMLElement) ||
        !(hand instanceof HTMLElement)
      ) {
        throw new Error('Participant card template is invalid.');
      }

      card = {
        card: node,
        hand,
        media,
        name,
        placeholder,
      };

      participantCards.set(identity, card);
      targetSlot.appendChild(node);
    } else if (card.card.parentElement !== targetSlot) {
      targetSlot.appendChild(card.card);
    }

    card.card.dataset.role = role;
    card.card.dataset.showCircle = readParticipantShowCircle(participant) ? 'true' : 'false';
    card.card.style.setProperty(
      '--conference-participant-preview-zoom',
      readParticipantPreviewZoom(participant).toFixed(2),
    );
    card.name.textContent = readParticipantName(participant);
    card.hand.hidden = !readParticipantHandRaised(participant);
    card.card.dataset.handRaised = readParticipantHandRaised(participant) ? 'true' : 'false';

    return card;
  };

  const removeParticipant = (identity: string) => {
    removeMount(mounts.participantVideoMounts.get(identity));
    removeMount(mounts.participantAudioMounts.get(identity));
    removeMount(mounts.screenVideoMounts.get(identity));
    removeMount(mounts.screenAudioMounts.get(identity));

    mounts.participantVideoMounts.delete(identity);
    mounts.participantAudioMounts.delete(identity);
    mounts.screenVideoMounts.delete(identity);
    mounts.screenAudioMounts.delete(identity);

    participantCards.get(identity)?.card.remove();
    participantCards.delete(identity);

    screenCards.get(identity)?.card.remove();
    screenCards.delete(identity);
  };

  const allParticipants = () => {
    if (room.state === ConnectionState.Disconnected) return [];
    return [room.localParticipant, ...Array.from(room.remoteParticipants.values())];
  };

  const syncParticipant = (participant: Participant) => {
    const card = ensureParticipantCard(participant);
    if (!card) return;
    syncParticipantVideo(room, participant, card, mounts, {
      blurLocalVideo: previewBlur,
    });
    syncParticipantAudio(room, participant, card, mounts);
    syncScreenVideo(participant, screenSlot, screenTemplate, screenCards, mounts);
    syncScreenAudio(room, participant, screenCards, mounts);
  };

  const renderParticipantList = () => {
    const participants = allParticipants();
    participantList.innerHTML = '';

    if (participants.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'conference-roster-empty';
      empty.textContent = 'Todavia no hay participantes en la sala.';
      participantList.appendChild(empty);
      return;
    }

    participants
      .sort((left, right) => {
        const leftRole = readParticipantRole(room, left, localRole);
        const rightRole = readParticipantRole(room, right, localRole);
        if (leftRole !== rightRole) return leftRole === 'teacher' ? -1 : 1;
        return readParticipantName(left).localeCompare(readParticipantName(right), 'es');
      })
      .forEach((participant) => {
        const item = document.createElement('li');
        item.className = 'conference-roster-item';

        const primary = document.createElement('span');
        primary.textContent = readParticipantName(participant);

        const secondary = document.createElement('span');
        const role = readParticipantRole(room, participant, localRole);
        secondary.textContent = `${role === 'teacher' ? 'Teacher' : 'Student'}${
          isLocalParticipant(room, participant) ? ' · You' : ''
        }`;

        item.append(primary, secondary);
        participantList.appendChild(item);
      });
  };

  const syncAllParticipants = () => {
    refreshFocusIdentity();
    syncScreenshareLayout();
    const activeParticipants = new Set(allParticipants().map((participant) => participant.identity));

    participantCards.forEach((_, identity) => {
      if (!activeParticipants.has(identity)) {
        removeParticipant(identity);
      }
    });

    allParticipants().forEach(syncParticipant);
    syncIdentityPreview();
    renderParticipantList();
    queuePreferredRemoteVideoDimensionsSync();
    setControlState();
  };

  const disconnectRoom = () => {
    stopRecording();
    closeDevicePanels();
    localHandRaised = false;
    syncRaiseHandUi();
    room.disconnect();
    participantCards.forEach((_, identity) => removeParticipant(identity));
    removeMount(localPreviewMount ?? undefined);
    localPreviewMount = null;
    if (disconnectedCameraPreviewEnabled) {
      void enableDisconnectedCameraPreview().catch((error) => {
        disableDisconnectedCameraPreview();
        setStatus(safeErrorMessage(error));
      });
    } else {
      clearIdentityPreviewSlot();
    }
    participantList.innerHTML = '';
    renderParticipantList();
    setControlState();
  };

  const connectRoom = async () => {
    const roomName = roomInput.value.trim();
    const identity = identityInput.value.trim();
    const displayName = nameInput.value.trim() || identity;
    localRole = normalizeRole(roleInput.value);

    if (!roomName || !identity) {
      setStatus('Room and identity are required before connecting.');
      return;
    }

    const shouldRestoreDisconnectedPreview = disconnectedCameraPreviewEnabled;
    removeLocalPreviewStream();
    clearIdentityPreviewSlot();

    if (connectButton instanceof HTMLButtonElement) {
      connectButton.disabled = true;
    }
    if (connectToggleButton instanceof HTMLButtonElement) {
      connectToggleButton.disabled = true;
    }
    setStatus('Solicitando token y conectando con la sala...');

    try {
      const tokenUrl = new URL('/api/token', window.location.origin);
      tokenUrl.searchParams.set('room', roomName);
      tokenUrl.searchParams.set('identity', identity);
      tokenUrl.searchParams.set('name', displayName);
      const pageSlug = getCurrentPresentationPageSlug();
      const effectiveCourseId = getEffectiveCourseId();
      if (effectiveCourseId) {
        tokenUrl.searchParams.set('course', effectiveCourseId);
      }
      if (pageSlug) {
        tokenUrl.searchParams.set('pageSlug', pageSlug);
      }

      const tokenResponse = await fetch(tokenUrl, {
        headers: {
          Accept: 'application/json',
        },
      });

      const tokenPayload = await tokenResponse.json().catch(() => null);
      if (!tokenResponse.ok || !tokenPayload?.token) {
        throw new Error(
          normalizeText(tokenPayload?.error) || 'Could not create a LiveKit access token.',
        );
      }

      livekitUrl = normalizeText(tokenPayload.livekitUrl) || livekitUrl;
      if (!livekitUrl) {
        throw new Error('LIVEKIT_URL is not configured on this deployment.');
      }

      identityInput.value = normalizeText(tokenPayload.identity) || identity;
      nameInput.value = normalizeText(tokenPayload.name) || displayName;
      localRole = normalizeRole(tokenPayload.role);
      syncRoleUi();
      persistSetupState();

      await room.connect(livekitUrl, tokenPayload.token);
      await room.startAudio().catch(() => undefined);

       if (preferredAudioInputId) {
        await room.switchActiveDevice('audioinput', preferredAudioInputId).catch(() => undefined);
      }
      if (preferredVideoInputId) {
        await room.switchActiveDevice('videoinput', preferredVideoInputId).catch(() => undefined);
      }

      try {
        await room.localParticipant.enableCameraAndMicrophone();
      } catch (error) {
        setStatus(
          `Connected, but camera or microphone permissions were not granted: ${safeErrorMessage(error)}`,
        );
      }

      await syncLocalBackgroundBlurProcessor().catch(() => undefined);

      if (preferredAudioInputId) {
        await room.switchActiveDevice('audioinput', preferredAudioInputId).catch(() => undefined);
      }
      if (preferredVideoInputId) {
        await room.switchActiveDevice('videoinput', preferredVideoInputId).catch(() => undefined);
      }
      await refreshDeviceOptions(true);

      writeQueryState();
      syncAllParticipants();
      setStatus(`Conectado a ${roomName}.`);
      await publishTeacherState();
      requestPresentationState();
    } catch (error) {
      if (shouldRestoreDisconnectedPreview && room.state === ConnectionState.Disconnected) {
        void enableDisconnectedCameraPreview().catch(() => {
          disableDisconnectedCameraPreview();
        });
      }
      setStatus(safeErrorMessage(error));
      if (connectButton instanceof HTMLButtonElement) {
        connectButton.disabled = false;
      }
      if (connectToggleButton instanceof HTMLButtonElement) {
        connectToggleButton.disabled = false;
      }
    } finally {
      setControlState();
    }
  };

  room
    .on(RoomEvent.ConnectionStateChanged, (state) => {
      stateNode.textContent = connectionStateLabel(state);
      setControlState();
    })
    .on(RoomEvent.Connected, () => {
      if (!connectedAtMs) {
        connectedAtMs = Date.now();
      }
      void syncLocalParticipantMetadata().catch(() => undefined);
      void syncLocalBackgroundBlurProcessor().catch(() => undefined);
      syncAllParticipants();
      setStatus(`Conectado a ${roomInput.value.trim()}.`);
      void refreshDeviceOptions(true);
      requestPresentationState();
      renderSessionTimer();
    })
    .on(RoomEvent.Disconnected, () => {
      if (destroyed) return;
      connectedAtMs = 0;
      localHandRaised = false;
      syncRaiseHandUi();
      stopRecording();
      participantCards.forEach((_, identity) => removeParticipant(identity));
      renderParticipantList();
      setStatus('Desconectado.');
      if (disconnectedCameraPreviewEnabled) {
        void enableDisconnectedCameraPreview().catch((error) => {
          disableDisconnectedCameraPreview();
          setStatus(safeErrorMessage(error));
        });
      } else {
        clearIdentityPreviewSlot();
      }
      void refreshDeviceOptions(false);
      setControlState();
    })
    .on(RoomEvent.ActiveSpeakersChanged, () => {
      syncAllParticipants();
    })
    .on(RoomEvent.ParticipantConnected, () => {
      syncAllParticipants();
      if (localRole === 'teacher') {
        window.setTimeout(() => {
          void publishTeacherState();
        }, 500);
      }
    })
    .on(RoomEvent.ParticipantDisconnected, (participant) => {
      removeParticipant(participant.identity);
      syncAllParticipants();
    })
    .on(RoomEvent.TrackSubscribed, (_, __, participant) => {
      syncAllParticipants();
    })
    .on(RoomEvent.TrackUnsubscribed, (_, __, participant) => {
      syncAllParticipants();
    })
    .on(RoomEvent.LocalTrackPublished, () => {
      void syncLocalBackgroundBlurProcessor().catch(() => undefined);
      syncAllParticipants();
      void refreshDeviceOptions(true);
    })
    .on(RoomEvent.LocalTrackUnpublished, () => {
      syncAllParticipants();
      void refreshDeviceOptions(true);
    })
    .on(RoomEvent.ActiveDeviceChanged, (kind, deviceId) => {
      if (kind === 'audioinput') {
        syncSelectGroupValue(audioInputSelects, deviceId);
        preferredAudioInputId = normalizeText(deviceId);
      }

      if (kind === 'videoinput') {
        syncSelectGroupValue(videoInputSelects, deviceId);
        preferredVideoInputId = normalizeText(deviceId);
      }

      persistSetupState();
      setControlState();
    })
    .on(RoomEvent.ParticipantMetadataChanged, (_, participant) => {
      if (!participant) return;
      syncParticipant(participant);
      renderParticipantList();
    })
    .on(RoomEvent.ParticipantNameChanged, (_, participant) => {
      syncParticipant(participant);
      renderParticipantList();
    })
    .on(RoomEvent.TrackMuted, (_, participant) => {
      syncAllParticipants();
    })
    .on(RoomEvent.TrackUnmuted, (_, participant) => {
      syncAllParticipants();
    })
    .on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
      if (kind !== DataPacket_Kind.RELIABLE || topic !== MESSAGE_TOPIC || !participant) return;

      const message = readMessage(payload);
      if (!message) return;

      if (message.type === 'chat') {
        appendChatMessage({
          ...message,
          identity: participant.identity,
          name: readParticipantName(participant),
          role: readParticipantRole(room, participant, localRole),
        });
        return;
      }

      if (readParticipantRole(room, participant, localRole) !== 'teacher') return;

      if (message.type === 'layout') {
        const nextLayout = setLayout(stage, message.layout);
        layoutInput.value = nextLayout;
        if (nextLayout !== 'screenshare') {
          layoutBeforeAutoScreenshare = nextLayout;
          autoSwitchedToScreenshare = false;
        }
        syncAllParticipants();
        return;
      }

      if (message.type === 'presentation') {
        schedulePresentationLoad({
          href: message.href,
          successMessage: message.href ? 'Escena actualizada por teacher.' : 'Escena limpia por teacher.',
        });
        return;
      }

      if (message.type === 'session-setup') {
        presentationCircleZoom = normalizePreviewZoom(message.previewZoom, presentationCircleZoom);
        showPresentationCircle = Boolean(message.showCircle);
        applyPreviewZoomState();
        applyShowCircleState();
        return;
      }

      if (message.type === 'slide-state') {
        currentSlideState = {
          indexf: message.indexf,
          indexh: message.indexh,
          indexv: message.indexv,
          zoom: message.zoom,
        };
        applyRemoteSlideState(currentSlideState);
      }
    });

  if (connectButton instanceof HTMLButtonElement) {
    connectButton.addEventListener('click', () => {
      void connectRoom();
    });
  }

  if (disconnectButton instanceof HTMLButtonElement) {
    disconnectButton.addEventListener('click', () => {
      disconnectRoom();
    });
  }

  if (connectToggleButton instanceof HTMLButtonElement) {
    connectToggleButton.addEventListener('click', () => {
      if (
        room.state === ConnectionState.Connected ||
        room.state === ConnectionState.Connecting ||
        room.state === ConnectionState.Reconnecting ||
        room.state === ConnectionState.SignalReconnecting
      ) {
        disconnectRoom();
        return;
      }

      void connectRoom();
    });
  }

  if (liveActivityButton instanceof HTMLButtonElement) {
    liveActivityButton.addEventListener('click', () => {
      const href = normalizeText(liveActivityButton.dataset.liveHref);
      if (href) {
        window.location.href = href;
      }
    });
  }

  cameraButton.addEventListener('click', async (event) => {
    if (event instanceof MouseEvent && event.shiftKey) {
      event.preventDefault();
      if (activeDevicePanel === 'video') {
        closeDevicePanels();
      } else {
        openDevicePanel('video');
      }
      setControlState();
      return;
    }

    if (room.state !== ConnectionState.Connected) {
      try {
        if (disconnectedCameraPreviewEnabled) {
          disableDisconnectedCameraPreview();
          setStatus('Preview de camara desactivado.');
        } else {
          await enableDisconnectedCameraPreview();
          setStatus('Preview de camara listo.');
        }
        setControlState();
      } catch (error) {
        disableDisconnectedCameraPreview();
        setStatus(safeErrorMessage(error));
        setControlState();
      }
      return;
    }

    try {
      await room.localParticipant.setCameraEnabled(!room.localParticipant.isCameraEnabled);
      await syncLocalBackgroundBlurProcessor().catch(() => undefined);
      syncAllParticipants();
      setControlState();
    } catch (error) {
      setStatus(safeErrorMessage(error));
    }
  });

  microphoneButton.addEventListener('click', async (event) => {
    if (event instanceof MouseEvent && event.shiftKey) {
      event.preventDefault();
      if (activeDevicePanel === 'audio') {
        closeDevicePanels();
      } else {
        openDevicePanel('audio');
      }
      setControlState();
      return;
    }

    if (room.state !== ConnectionState.Connected) return;

    try {
      await room.localParticipant.setMicrophoneEnabled(!room.localParticipant.isMicrophoneEnabled);
      syncAllParticipants();
      setControlState();
    } catch (error) {
      setStatus(safeErrorMessage(error));
    }
  });

  shareScreenButton.addEventListener('click', async () => {
    if (room.state !== ConnectionState.Connected) return;

    try {
      await room.localParticipant.setScreenShareEnabled(!room.localParticipant.isScreenShareEnabled);
      syncAllParticipants();
      setControlState();
    } catch (error) {
      setStatus(safeErrorMessage(error));
    }
  });

  if (recordButton instanceof HTMLButtonElement) {
    recordButton.addEventListener('click', async () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        stopRecording();
        return;
      }

      try {
        await startRecording();
      } catch (error) {
        cleanupRecording();
        setStatus(safeErrorMessage(error));
      }
    });
  }

  if (fullscreenButton instanceof HTMLButtonElement) {
    fullscreenButton.addEventListener('click', () => {
      void toggleFullscreen().catch((error) => {
        applyImmersiveFullscreenState(false);
        syncFullscreenButton();
        setStatus(safeErrorMessage(error));
      });
    });
  }

  if (sidebarToggleButton instanceof HTMLButtonElement) {
    sidebarToggleButton.addEventListener('click', () => {
      toggleSidebarCollapsed();
    });
  }

  if (instrumentsToggleButton instanceof HTMLButtonElement) {
    instrumentsToggleButton.addEventListener('click', () => {
      toggleInstrumentsOpen();
    });
  }

  audioInputSelects.forEach((select) => {
    select.addEventListener('change', async () => {
      const nextDeviceId = normalizeText(select.value);
      if (!nextDeviceId) return;
      preferredAudioInputId = nextDeviceId;
      syncSelectGroupValue(audioInputSelects, nextDeviceId);
      persistSetupState();

      try {
        await room.switchActiveDevice('audioinput', nextDeviceId);
        await refreshDeviceOptions(false);
      } catch (error) {
        setStatus(
          room.state === ConnectionState.Connected
            ? safeErrorMessage(error)
            : 'Microfono preferido listo para la proxima conexion.',
        );
      }
    });
  });

  videoInputSelects.forEach((select) => {
    select.addEventListener('change', async () => {
      const nextDeviceId = normalizeText(select.value);
      if (!nextDeviceId) return;
      preferredVideoInputId = nextDeviceId;
      syncSelectGroupValue(videoInputSelects, nextDeviceId);
      persistSetupState();

      if (room.state === ConnectionState.Disconnected) {
        if (!disconnectedCameraPreviewEnabled) {
          setStatus('Camara preferida lista para la proxima conexion.');
          setControlState();
          return;
        }

        try {
          await enableDisconnectedCameraPreview();
          setStatus('Preview de camara actualizado.');
          setControlState();
        } catch (error) {
          disableDisconnectedCameraPreview();
          setStatus(safeErrorMessage(error));
          setControlState();
        }
        return;
      }

      try {
        await room.switchActiveDevice('videoinput', nextDeviceId);
        await syncLocalBackgroundBlurProcessor().catch(() => undefined);
        await refreshDeviceOptions(false);
      } catch (error) {
        setStatus(
          room.state === ConnectionState.Connected
            ? safeErrorMessage(error)
            : 'Camara preferida lista para la proxima conexion.',
        );
      }
    });
  });

  if (previewZoomInput instanceof HTMLInputElement) {
    previewZoomInput.addEventListener('input', () => {
      previewZoom = normalizePreviewZoom(previewZoomInput.value, previewZoom);
      presentationCircleZoom = previewZoom;
      applyPreviewZoomState();
      persistSetupState();
      if (room.state === ConnectionState.Connected) {
        void syncLocalParticipantMetadata().catch(() => undefined);
      }
      if (room.state === ConnectionState.Connected && localRole === 'teacher') {
        void publishMessage({
          type: 'session-setup',
          previewZoom,
          showCircle: showPresentationCircle,
        });
      }
    });
  }

  if (showCircleInput instanceof HTMLInputElement) {
    showCircleInput.addEventListener('change', () => {
      showPresentationCircle = showCircleInput.checked;
      applyShowCircleState();
      persistSetupState();
      if (room.state === ConnectionState.Connected) {
        void syncLocalParticipantMetadata().catch(() => undefined);
      }
      if (room.state === ConnectionState.Connected && localRole === 'teacher') {
        void publishMessage({
          type: 'session-setup',
          previewZoom,
          showCircle: showPresentationCircle,
        });
      }
    });
  }

  if (previewBlurInput instanceof HTMLInputElement) {
    previewBlurInput.addEventListener('change', () => {
      previewBlur = previewBlurInput.checked;
      applyPreviewBlurState();
      persistSetupState();

      if (room.state === ConnectionState.Disconnected && disconnectedCameraPreviewEnabled) {
        disableDisconnectedCameraPreview();
        void enableDisconnectedCameraPreview().catch((error) => {
          setStatus(safeErrorMessage(error));
        });
        return;
      }

      if (room.state === ConnectionState.Connected) {
        void syncLocalBackgroundBlurProcessor()
          .then(() => {
            syncIdentityPreview();
            syncAllParticipants();
          })
          .catch((error) => {
            setStatus(safeErrorMessage(error));
          });
        return;
      }

      syncIdentityPreview();
      syncAllParticipants();
    });
  }

  if (handTrackInput instanceof HTMLInputElement) {
    handTrackInput.addEventListener('change', () => {
      handTrackEnabled = handTrackInput.checked;
      applyHandTrackState();
      persistSetupState();

      if (handTrackEnabled) {
        void startHandTracking();
        return;
      }

      stopHandTracking();
    });
  }

  if (synthMasterInput instanceof HTMLInputElement) {
    const syncMasterGain = () => {
      synthMasterGain = normalizeMasterGain(synthMasterInput.value, synthMasterGain);
      applySynthMasterGainState();
      persistSetupState();
    };

    synthMasterInput.addEventListener('input', syncMasterGain);
    synthMasterInput.addEventListener('change', syncMasterGain);
  }

  layoutChoiceButtons.forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    button.addEventListener('click', () => {
      const requestedLayout = normalizeLayoutMode(button.dataset.layoutChoice || '');
      if (requestedLayout === 'presentation' && getCurrentLayout() === 'presentation') {
        resetPresentationZoom();
        return;
      }
      if (layoutInput.disabled) return;
      layoutInput.value = requestedLayout;
      layoutInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  layoutInput.addEventListener('change', () => {
    if (hasActiveScreenShare()) {
      layoutInput.value = 'screenshare';
    }
    const nextLayout = setLayout(stage, layoutInput.value);
    layoutInput.value = nextLayout;
    if (nextLayout !== 'screenshare') {
      layoutBeforeAutoScreenshare = nextLayout;
      autoSwitchedToScreenshare = false;
    }
    writeQueryState();
    syncAllParticipants();

    if (room.state === ConnectionState.Connected && localRole === 'teacher') {
      void publishMessage({
        type: 'layout',
        layout: nextLayout,
      });
    }
  });

  if (presentationButton instanceof HTMLButtonElement) {
    presentationButton.addEventListener('click', () => {
      const selectedHref = normalizeText(presentationSelect.value) || null;
      schedulePresentationLoad({
        broadcast: room.state === ConnectionState.Connected && localRole === 'teacher',
        href: selectedHref,
        successMessage: selectedHref ? 'Escena Reveal cargada.' : 'Escena limpia.',
      });
    });
  }

  presentationSelect.addEventListener('change', () => {
    const selectedHref = normalizeText(presentationSelect.value) || null;
    schedulePresentationLoad({
      broadcast: room.state === ConnectionState.Connected && localRole === 'teacher',
      href: selectedHref,
      successMessage: selectedHref ? 'Escena Reveal cargada.' : 'Escena limpia.',
    });
    setControlState();
  });

  if (presentationClearButton instanceof HTMLButtonElement) {
    presentationClearButton.addEventListener('click', () => {
      presentationSelect.value = '';
      schedulePresentationLoad({
        broadcast: room.state === ConnectionState.Connected && localRole === 'teacher',
        href: null,
        successMessage: 'Escena limpia.',
      });
    });
  }

  if (raiseHandButton instanceof HTMLButtonElement) {
    raiseHandButton.addEventListener('click', () => {
      void toggleRaisedHand();
    });
  }

  const sendChatMessage = async () => {
    if (room.state !== ConnectionState.Connected) return;

    const text = normalizeText(chatInput.value);
    if (!text) return;

    const message: Extract<ConferenceMessage, { type: 'chat' }> = {
      type: 'chat',
      id: `chat-${crypto.randomUUID()}`,
      identity: identityInput.value.trim(),
      name: nameInput.value.trim() || identityInput.value.trim() || 'Participant',
      role: localRole,
      sentAt: new Date().toISOString(),
      text,
    };

    appendChatMessage(message);
    chatInput.value = '';

    try {
      await publishMessage(message);
    } catch (error) {
      setStatus(safeErrorMessage(error));
    }
  };

  chatSendButton.addEventListener('click', () => {
    void sendChatMessage();
  });

  chatDownloadButton.addEventListener('click', () => {
    downloadChatTranscript();
  });

  chatInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    void sendChatMessage();
  });

  const handleRoomShortcutKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.repeat) return;
    const isSidebarShortcut =
      (event.metaKey || event.ctrlKey) &&
      event.shiftKey &&
      !event.altKey &&
      (event.key === '?' || event.key === '/');

    if (isSidebarShortcut) {
      event.preventDefault();
      toggleSidebarCollapsed();
      return;
    }

    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (shouldIgnoreRoomShortcut(event.target)) return;

    if (event.key.toLowerCase() === 'm') {
      event.preventDefault();
      void toggleRaisedHand();
    }
  };

  document.addEventListener('keydown', handleRoomShortcutKeydown);

  [roomInput, identityInput, nameInput].forEach((input) => {
    input.addEventListener('change', () => {
      writeQueryState();
      persistSetupState();
    });
    input.addEventListener('input', persistSetupState);
  });

  const handlePresentationLoad = () => {
    postToPresentation({ type: 'musiki:live-snapshot', snapshot: activeLiveSnapshot });
    if (pendingRemoteSlideState) {
      applyRemoteSlideState(pendingRemoteSlideState);
      return;
    }
    if (localRole === 'teacher') {
      requestPresentationState();
    }
  };

  presentationFrame.addEventListener('load', handlePresentationLoad);

  window.addEventListener('message', handlePresentationMessage);
  document.addEventListener('fullscreenchange', syncFullscreenButton);
  document.addEventListener('webkitfullscreenchange', syncFullscreenButton as EventListener);

  syncRoleUi();
  applyInstrumentsOpenState();
  applySidebarCollapsedState();
  applyPreviewZoomState();
  applyPreviewBlurState();
  applyShowCircleState();
  applyHandTrackState();
  applySynthMasterGainState();
  clearHandTrackingOutput();
  setLayout(stage, layoutInput.value);
  renderParticipantList();
  renderChat();
  syncPresentationSelection(normalizeText(presentationSelect.value) || null);
  void refreshDeviceOptions(false);
  syncLiveActivityTransport();

  if (handTrackEnabled) {
    void startHandTracking();
  }

  if (presentationSelect.value) {
    schedulePresentationLoad({
      href: normalizeText(presentationSelect.value) || null,
      successMessage: 'Escena Reveal lista.',
    });
  }

  setStatus(
    presentationSelect.value
      ? 'Escena Reveal preparada.'
      : 'Configura la sala y conecta.',
  );

  setControlState();

  const handleDeviceChange = () => {
    void refreshDeviceOptions(false);
  };

  const handleLiveActivityTick = () => {
    renderLiveActivity();
    renderSessionTimer();
  };

  const handleViewportResize = () => {
    queuePreferredRemoteVideoDimensionsSync();
  };

  navigator.mediaDevices?.addEventListener?.('devicechange', handleDeviceChange);
  liveActivityTickId = window.setInterval(handleLiveActivityTick, 1000);
  window.addEventListener('resize', handleViewportResize);

  const teardown = () => {
    if (destroyed) return;
    destroyed = true;
    if (pendingPresentationTask) {
      window.clearTimeout(pendingPresentationTask);
      pendingPresentationTask = 0;
    }
    navigator.mediaDevices?.removeEventListener?.('devicechange', handleDeviceChange);
    window.removeEventListener('resize', handleViewportResize);
    presentationFrame.removeEventListener('load', handlePresentationLoad);
    window.removeEventListener('message', handlePresentationMessage);
    document.removeEventListener('keydown', handleRoomShortcutKeydown);
    document.removeEventListener('fullscreenchange', syncFullscreenButton);
    document.removeEventListener('webkitfullscreenchange', syncFullscreenButton as EventListener);
    unsubscribeLiveActivity?.();
    unsubscribeLiveActivity = null;
    if (liveActivityTickId) {
      window.clearInterval(liveActivityTickId);
      liveActivityTickId = 0;
    }
    stopHandTracking();
    handTrackingLandmarker?.close?.();
    handTrackingLandmarker = null;
    void fmSynth.destroy();
    stopMicMeter();
    closeMicMeterAudioContext();
    applyImmersiveFullscreenState(false);
    stopRecording();
    disableDisconnectedCameraPreview();
    disconnectRoom();
    root.dataset.mounted = 'false';
  };

  window.addEventListener('pagehide', teardown, { once: true });

  return teardown;
};
