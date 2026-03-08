import {
  ConnectionState,
  DataPacket_Kind,
  Room,
  RoomEvent,
  Track,
  type LocalParticipant,
  type RemoteParticipant,
  type TrackPublication,
} from 'livekit-client';

import { normalizeLayoutMode, setLayout, type LayoutMode } from './layout-controller';
import { createPresentationController } from './presentation';

type Participant = LocalParticipant | RemoteParticipant;
type ParticipantRole = 'teacher' | 'student';

type ConferenceMessage =
  | {
      type: 'layout';
      layout: LayoutMode;
    }
  | {
      type: 'presentation';
      href: string | null;
    };

type ParticipantCardRefs = {
  card: HTMLElement;
  media: HTMLElement;
  name: HTMLElement;
  placeholder: HTMLElement;
  role: HTMLElement;
};

type ScreenCardRefs = {
  card: HTMLElement;
  media: HTMLElement;
  name: HTMLElement;
};

type MediaMount = {
  element: HTMLMediaElement;
  track: Track;
  trackSid: string;
};

type ParticipantMount = MediaMount & {
  wrapper: HTMLElement;
};

type MountCollection = {
  participantAudioMounts: Map<string, MediaMount>;
  participantVideoMounts: Map<string, ParticipantMount>;
  screenAudioMounts: Map<string, MediaMount>;
  screenVideoMounts: Map<string, ParticipantMount>;
};

const MESSAGE_TOPIC = 'conference-ui';
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const normalizeText = (value: unknown) => String(value ?? '').trim();

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

  try {
    const parsed = JSON.parse(participant.metadata || '{}');
    return normalizeRole(parsed?.role);
  } catch {
    return participant.identity.toLowerCase().startsWith('teacher') ? 'teacher' : 'student';
  }
};

const readParticipantName = (participant: Participant) =>
  normalizeText(participant.name) || normalizeText(participant.identity) || 'Participant';

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

const removeMount = (mount: MediaMount | ParticipantMount | undefined) => {
  if (!mount) return;
  mount.track.detach(mount.element);
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

const syncParticipantVideo = (
  room: Room,
  participant: Participant,
  card: ParticipantCardRefs,
  mounts: MountCollection,
) => {
  const publication = Array.from(participant.videoTrackPublications.values()).find(
    (entry) => entry.track && entry.source !== Track.Source.ScreenShare,
  );
  const identity = participant.identity;
  const existingMount = mounts.participantVideoMounts.get(identity);

  if (!publication?.track) {
    removeMount(existingMount);
    mounts.participantVideoMounts.delete(identity);
    card.media.innerHTML = '';
    card.placeholder.hidden = false;
    return;
  }

  const trackSid = getTrackSid(publication);
  if (existingMount && existingMount.trackSid === trackSid && existingMount.track === publication.track) {
    card.placeholder.hidden = true;
    return;
  }

  removeMount(existingMount);
  card.media.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'conference-media-frame';

  const element = createMediaElement(publication.track, isLocalParticipant(room, participant));
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

  mounts.participantAudioMounts.set(identity, {
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

  mounts.screenAudioMounts.set(identity, {
    element,
    track: publication.track,
    trackSid,
  });
};

export const mountLiveKitRoom = (root: HTMLElement) => {
  if (root.dataset.mounted === 'true') {
    return () => {};
  }
  root.dataset.mounted = 'true';

  const livekitUrl = normalizeText(root.dataset.livekitUrl);

  const roomInput = root.querySelector('[data-room-input]');
  const identityInput = root.querySelector('[data-identity-input]');
  const nameInput = root.querySelector('[data-name-input]');
  const roleInput = root.querySelector('[data-role-input]');
  const layoutInput = root.querySelector('[data-layout-input]');
  const presentationInput = root.querySelector('[data-presentation-input]');
  const statusNode = root.querySelector('[data-room-status]');
  const stateNode = root.querySelector('[data-room-state]');
  const countNode = root.querySelector('[data-participant-count]');
  const connectButton = root.querySelector('[data-action="connect"]');
  const disconnectButton = root.querySelector('[data-action="disconnect"]');
  const cameraButton = root.querySelector('[data-action="camera"]');
  const microphoneButton = root.querySelector('[data-action="microphone"]');
  const shareScreenButton = root.querySelector('[data-action="screen-share"]');
  const presentationButton = root.querySelector('[data-action="presentation"]');
  const teacherSlot = root.querySelector('[data-slot="teacher"]');
  const studentsSlot = root.querySelector('[data-slot="students"]');
  const screenSlot = root.querySelector('[data-slot="screen"]');
  const participantList = root.querySelector('[data-participant-list]');
  const stage = root.querySelector('[data-stage]');
  const participantTemplate = root.querySelector('[data-template="participant-card"]');
  const screenTemplate = root.querySelector('[data-template="screen-card"]');
  const presentationFrame = root.querySelector('[data-presentation-frame]');
  const presentationPlaceholder = root.querySelector('[data-presentation-placeholder]');

  if (
    !(roomInput instanceof HTMLInputElement) ||
    !(identityInput instanceof HTMLInputElement) ||
    !(nameInput instanceof HTMLInputElement) ||
    !(roleInput instanceof HTMLSelectElement) ||
    !(layoutInput instanceof HTMLSelectElement) ||
    !(presentationInput instanceof HTMLInputElement) ||
    !(statusNode instanceof HTMLElement) ||
    !(stateNode instanceof HTMLElement) ||
    !(countNode instanceof HTMLElement) ||
    !(connectButton instanceof HTMLButtonElement) ||
    !(disconnectButton instanceof HTMLButtonElement) ||
    !(cameraButton instanceof HTMLButtonElement) ||
    !(microphoneButton instanceof HTMLButtonElement) ||
    !(shareScreenButton instanceof HTMLButtonElement) ||
    !(presentationButton instanceof HTMLButtonElement) ||
    !(teacherSlot instanceof HTMLElement) ||
    !(studentsSlot instanceof HTMLElement) ||
    !(screenSlot instanceof HTMLElement) ||
    !(participantList instanceof HTMLElement) ||
    !(stage instanceof HTMLElement) ||
    !(participantTemplate instanceof HTMLTemplateElement) ||
    !(screenTemplate instanceof HTMLTemplateElement) ||
    !(presentationFrame instanceof HTMLIFrameElement) ||
    !(presentationPlaceholder instanceof HTMLElement)
  ) {
    throw new Error('Conference room DOM is incomplete.');
  }

  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
  });

  const presentation = createPresentationController({
    frame: presentationFrame,
    input: presentationInput,
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

  let destroyed = false;
  let localRole = normalizeRole(roleInput.value);

  const getCurrentLayout = () => setLayout(stage, layoutInput.value);

  const setStatus = (message: string) => {
    statusNode.textContent = message;
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

      return null;
    } catch {
      return null;
    }
  };

  const writeQueryState = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('room', roomInput.value.trim());
    params.set('identity', identityInput.value.trim());
    if (nameInput.value.trim()) {
      params.set('name', nameInput.value.trim());
    } else {
      params.delete('name');
    }
    params.set('role', roleInput.value);

    const presentationHref = presentation.getHref() || presentation.readDraft();
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
  };

  const setControlState = () => {
    const connected = room.state === ConnectionState.Connected;
    const connecting =
      room.state === ConnectionState.Connecting ||
      room.state === ConnectionState.Reconnecting ||
      room.state === ConnectionState.SignalReconnecting;
    const livekitReady = Boolean(livekitUrl);

    stateNode.textContent = connectionStateLabel(room.state);
    countNode.textContent = `${room.remoteParticipants.size + (connected ? 1 : 0)} participantes`;

    connectButton.disabled = !livekitReady || connected || connecting;
    disconnectButton.disabled = !connected && !connecting;
    cameraButton.disabled = !connected;
    microphoneButton.disabled = !connected;
    shareScreenButton.disabled = !connected;
    layoutInput.disabled = connected && localRole !== 'teacher';
    presentationInput.disabled = connected && localRole !== 'teacher';
    presentationButton.disabled = connected && localRole !== 'teacher';
    roleInput.disabled = connected || connecting;
    roomInput.disabled = connected || connecting;
    identityInput.disabled = connected || connecting;
    nameInput.disabled = connected || connecting;

    cameraButton.textContent = connected && room.localParticipant.isCameraEnabled
      ? 'Apagar camara'
      : 'Encender camara';
    microphoneButton.textContent = connected && room.localParticipant.isMicrophoneEnabled
      ? 'Silenciar microfono'
      : 'Activar microfono';
    shareScreenButton.textContent = connected && room.localParticipant.isScreenShareEnabled
      ? 'Detener pantalla'
      : 'Compartir pantalla';
  };

  const ensureParticipantCard = (participant: Participant) => {
    const identity = participant.identity;
    const role = readParticipantRole(room, participant, localRole);
    const targetSlot = role === 'teacher' ? teacherSlot : studentsSlot;

    let card = participantCards.get(identity);
    if (!card) {
      const node = cloneTemplate(participantTemplate);
      const media = node.querySelector('[data-card-media]');
      const name = node.querySelector('[data-card-name]');
      const roleNode = node.querySelector('[data-card-role]');
      const placeholder = node.querySelector('[data-card-placeholder]');

      if (
        !(media instanceof HTMLElement) ||
        !(name instanceof HTMLElement) ||
        !(roleNode instanceof HTMLElement) ||
        !(placeholder instanceof HTMLElement)
      ) {
        throw new Error('Participant card template is invalid.');
      }

      card = {
        card: node,
        media,
        name,
        placeholder,
        role: roleNode,
      };

      participantCards.set(identity, card);
      targetSlot.appendChild(node);
    } else if (card.card.parentElement !== targetSlot) {
      targetSlot.appendChild(card.card);
    }

    card.card.dataset.role = role;
    card.name.textContent = readParticipantName(participant);
    card.role.textContent = role === 'teacher' ? 'Teacher' : 'Student';

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
    syncParticipantVideo(room, participant, card, mounts);
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
    const activeParticipants = new Set(allParticipants().map((participant) => participant.identity));

    participantCards.forEach((_, identity) => {
      if (!activeParticipants.has(identity)) {
        removeParticipant(identity);
      }
    });

    allParticipants().forEach(syncParticipant);
    renderParticipantList();
    setControlState();
  };

  const disconnectRoom = () => {
    room.disconnect();
    participantCards.forEach((_, identity) => removeParticipant(identity));
    participantList.innerHTML = '';
    renderParticipantList();
    setControlState();
  };

  const connectRoom = async () => {
    const roomName = roomInput.value.trim();
    const identity = identityInput.value.trim();
    const displayName = nameInput.value.trim() || identity;
    localRole = normalizeRole(roleInput.value);

    if (!livekitUrl) {
      setStatus('LIVEKIT_URL is not configured on this deployment.');
      setControlState();
      return;
    }

    if (!roomName || !identity) {
      setStatus('Room and identity are required before connecting.');
      return;
    }

    connectButton.disabled = true;
    setStatus('Solicitando token y conectando con la sala...');

    try {
      const tokenUrl = new URL('/api/token', window.location.origin);
      tokenUrl.searchParams.set('room', roomName);
      tokenUrl.searchParams.set('identity', identity);
      tokenUrl.searchParams.set('name', displayName);
      tokenUrl.searchParams.set('role', localRole);

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

      identityInput.value = normalizeText(tokenPayload.identity) || identity;
      nameInput.value = normalizeText(tokenPayload.name) || displayName;
      roleInput.value = normalizeRole(tokenPayload.role);
      localRole = normalizeRole(roleInput.value);

      await room.connect(livekitUrl, tokenPayload.token);
      await room.startAudio().catch(() => undefined);

      try {
        await room.localParticipant.enableCameraAndMicrophone();
      } catch (error) {
        setStatus(
          `Connected, but camera or microphone permissions were not granted: ${safeErrorMessage(error)}`,
        );
      }

      try {
        presentation.setHref(presentation.readDraft());
      } catch (error) {
        setStatus(safeErrorMessage(error));
      }

      writeQueryState();
      syncAllParticipants();
      setStatus(`Conectado a ${roomName}.`);
      await publishTeacherState();
    } catch (error) {
      setStatus(safeErrorMessage(error));
      connectButton.disabled = false;
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
      syncAllParticipants();
      setStatus(`Conectado a ${roomInput.value.trim()}.`);
    })
    .on(RoomEvent.Disconnected, () => {
      if (destroyed) return;
      participantCards.forEach((_, identity) => removeParticipant(identity));
      renderParticipantList();
      setStatus('Desconectado.');
      setControlState();
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
      syncParticipant(participant);
      renderParticipantList();
      setControlState();
    })
    .on(RoomEvent.TrackUnsubscribed, (_, __, participant) => {
      syncParticipant(participant);
      renderParticipantList();
      setControlState();
    })
    .on(RoomEvent.LocalTrackPublished, () => {
      syncAllParticipants();
    })
    .on(RoomEvent.LocalTrackUnpublished, () => {
      syncAllParticipants();
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
      syncParticipant(participant);
    })
    .on(RoomEvent.TrackUnmuted, (_, participant) => {
      syncParticipant(participant);
    })
    .on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
      if (kind !== DataPacket_Kind.RELIABLE || topic !== MESSAGE_TOPIC || !participant) return;
      if (readParticipantRole(room, participant, localRole) !== 'teacher') return;

      const message = readMessage(payload);
      if (!message) return;

      if (message.type === 'layout') {
        const nextLayout = setLayout(stage, message.layout);
        layoutInput.value = nextLayout;
        return;
      }

      if (message.type === 'presentation') {
        try {
          if (message.href) {
            presentation.setHref(message.href);
          } else {
            presentation.clear();
          }
          writeQueryState();
        } catch (error) {
          setStatus(safeErrorMessage(error));
        }
      }
    });

  connectButton.addEventListener('click', () => {
    void connectRoom();
  });

  disconnectButton.addEventListener('click', () => {
    disconnectRoom();
  });

  cameraButton.addEventListener('click', async () => {
    if (room.state !== ConnectionState.Connected) return;

    try {
      await room.localParticipant.setCameraEnabled(!room.localParticipant.isCameraEnabled);
      syncAllParticipants();
      setControlState();
    } catch (error) {
      setStatus(safeErrorMessage(error));
    }
  });

  microphoneButton.addEventListener('click', async () => {
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

  layoutInput.addEventListener('change', () => {
    const nextLayout = setLayout(stage, layoutInput.value);
    layoutInput.value = nextLayout;
    writeQueryState();

    if (room.state === ConnectionState.Connected && localRole === 'teacher') {
      void publishMessage({
        type: 'layout',
        layout: nextLayout,
      });
    }
  });

  presentationButton.addEventListener('click', () => {
    try {
      const nextHref = presentation.setHref(presentation.readDraft());
      writeQueryState();

      if (room.state === ConnectionState.Connected && localRole === 'teacher') {
        void publishMessage({
          type: 'presentation',
          href: nextHref,
        });
      }
    } catch (error) {
      setStatus(safeErrorMessage(error));
    }
  });

  presentationInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    presentationButton.click();
  });

  roleInput.addEventListener('change', () => {
    localRole = normalizeRole(roleInput.value);
    setControlState();
    writeQueryState();
  });

  [roomInput, identityInput, nameInput].forEach((input) => {
    input.addEventListener('change', writeQueryState);
  });

  setLayout(stage, layoutInput.value);
  renderParticipantList();

  try {
    if (presentationInput.value.trim()) {
      presentation.setHref(presentationInput.value);
    }
  } catch (error) {
    setStatus(safeErrorMessage(error));
  }

  if (!livekitUrl) {
    setStatus('LIVEKIT_URL is missing. Add it to the server environment before connecting.');
  } else {
    setStatus('Configura la sala y conecta. Astro renderiza la estructura; LiveKit la hidrata.');
  }

  setControlState();

  const teardown = () => {
    if (destroyed) return;
    destroyed = true;
    disconnectRoom();
    root.dataset.mounted = 'false';
  };

  window.addEventListener('beforeunload', teardown, { once: true });

  return teardown;
};
