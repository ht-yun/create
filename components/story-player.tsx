"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { ArrowLeft, Bookmark, ChevronLeft, ChevronRight, Eye, EyeOff, Fullscreen, Headphones, History, Home, ImageIcon, Maximize2, Minimize2, MoreHorizontal, RotateCcw, Share2, SkipForward, SlidersHorizontal, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import type { StoryChoice, StoryCondition, StoryDetail, StoryMedia, StoryNode, VariableChange } from "@/shared/story-contract";

type VariableState = Record<string, number | boolean | string>;
type HistoryEntry = { nodeId: string; variables: VariableState; choiceLabel?: string; mediaIndex?: number };
type SavedExperience = { currentId: string; variables: VariableState; history: HistoryEntry[]; mediaIndex: number; mediaTimes?: Record<string, number>; savedAt: string };
type PlayerPreferences = { sound: boolean; fit: "cover" | "contain"; showValues: boolean; highContrast: boolean; reducedMotion: boolean; haptics: boolean; fontScale: number; overlayOpacity: number };
type DrawerName = "variables" | "history" | "settings";
type NarrationState = "none" | "waiting" | "playing" | "finished" | "skipped" | "failed";
type VisualFrame = {
  key: string;
  nodeId: string;
  mediaIndex: number;
  kind: "image" | "video" | "empty";
  url?: string;
  fallbackUrl?: string;
  posterUrl?: string;
  loop?: boolean;
  alt: string;
  focalPosition: string;
};
type VisualTransition = { kind: "node" | "gallery"; style: "fade" | "dissolve" | "cut"; direction: -1 | 0 | 1; duration: number };
type QueuedGallery = { index: number; direction: -1 | 1 };

const defaultPreferences: PlayerPreferences = { sound: false, fit: "cover", showValues: false, highContrast: false, reducedMotion: false, haptics: true, fontScale: 1, overlayOpacity: .82 };

function passes(condition: StoryCondition, variables: VariableState) {
  const current = variables[condition.variable];
  const target = condition.value;
  if (condition.operator === "eq") return current === target;
  if (condition.operator === "neq") return current !== target;
  if (typeof current !== "number" || typeof target !== "number") return false;
  return condition.operator === "gt" ? current > target : condition.operator === "gte" ? current >= target : condition.operator === "lt" ? current < target : current <= target;
}

function applyChanges(current: VariableState, changes: VariableChange[] = []) {
  const next = { ...current };
  for (const change of changes) {
    if (change.operation === "set") next[change.key] = change.value;
    else if (typeof next[change.key] === "number" && typeof change.value === "number") next[change.key] = change.operation === "add" ? Number(next[change.key]) + change.value : Number(next[change.key]) - change.value;
  }
  return next;
}

function focalPosition(media?: StoryMedia) {
  if (!media?.focalPoint) return "50% 50%";
  const x = media.focalPoint.x <= 1 ? media.focalPoint.x * 100 : media.focalPoint.x;
  const y = media.focalPoint.y <= 1 ? media.focalPoint.y * 100 : media.focalPoint.y;
  return `${Math.max(0, Math.min(100, x))}% ${Math.max(0, Math.min(100, y))}%`;
}

function playbackUrl(media?: StoryMedia) {
  return media?.kind === "image" ? media.playbackUrl ?? media.url : media?.url;
}

function hasNarration(node?: StoryNode) {
  return Boolean(node?.media?.some((media) => media.kind === "audio" && media.role === "voice" && media.url));
}

function frameForNode(story: StoryDetail, node: StoryNode, mediaIndex: number, resolvedUrl?: string, forceEmpty = false): VisualFrame {
  const visualMedia = (node.media ?? []).filter((media) => (media.kind === "image" || media.kind === "video") && (!media.role || media.role === "scene"));
  const selected = visualMedia[mediaIndex] ?? visualMedia[0];
  const selectedIndex = selected ? Math.max(0, visualMedia.indexOf(selected)) : 0;
  const selectedUrl = playbackUrl(selected);
  const url = forceEmpty ? undefined : resolvedUrl ?? selectedUrl ?? story.coverUrl;
  const kind = forceEmpty || !url ? "empty" : selected?.kind === "video" && url === selectedUrl ? "video" : "image";
  return {
    key: `${node.id}-${selectedIndex}-${url ?? "empty"}`,
    nodeId: node.id,
    mediaIndex: selectedIndex,
    kind,
    url,
    fallbackUrl: story.coverUrl && story.coverUrl !== url ? story.coverUrl : undefined,
    posterUrl: selected?.posterUrl ?? story.coverUrl,
    loop: selected?.loop ?? true,
    alt: selected?.alt ?? `${story.title}：${node.title}`,
    focalPosition: kind === "image" && url !== selectedUrl ? "50% 50%" : focalPosition(selected),
  };
}

function transitionDuration(style: VisualTransition["style"], reducedMotion: boolean, kind: VisualTransition["kind"]) {
  if (reducedMotion || style === "cut") return 0;
  if (kind === "gallery") return 420;
  return style === "fade" ? 520 : 800;
}

function distanceToEnding(startId: string, nodes: Map<string, StoryNode>) {
  const queue = [{ id: startId, distance: 0 }];
  const visited = new Set<string>();
  while (queue.length) {
    const item = queue.shift()!;
    if (visited.has(item.id)) continue;
    visited.add(item.id);
    const node = nodes.get(item.id);
    if (!node) continue;
    if (node.type === "ending") return item.distance;
    const targets = [...(node.choices ?? []).map((choice) => choice.targetNodeId), ...(node.nextNodeId ? [node.nextNodeId] : [])];
    for (const id of targets) if (!visited.has(id)) queue.push({ id, distance: item.distance + 1 });
  }
  return 1;
}

function SceneFrameView({ frame, phase, sound, videoRef, mediaTimes }: { frame: VisualFrame; phase: "active" | "incoming" | "outgoing"; sound: boolean; videoRef?: RefObject<HTMLVideoElement | null>; mediaTimes: RefObject<Record<string, number>> }) {
  const [source, setSource] = useState(() => ({ kind: frame.kind, url: frame.url }));
  const fail = () => setSource((currentSource) => frame.fallbackUrl && currentSource.url !== frame.fallbackUrl ? { kind: "image", url: frame.fallbackUrl } : { kind: "empty", url: undefined });
  const backdropUrl = source.kind === "video" ? frame.posterUrl ?? frame.fallbackUrl : source.url;
  return <div className={`scene-frame scene-frame-${phase}`} data-frame-key={frame.key} aria-hidden={phase === "outgoing" ? true : undefined}>
    {backdropUrl ? <div className="scene-backdrop" aria-hidden="true" style={{ backgroundImage: `url("${backdropUrl.replaceAll('"', '%22')}")` }} /> : null}
    <div className="scene-media">
      {source.kind === "image" && source.url ? <Image src={source.url} alt={frame.alt} fill priority unoptimized sizes="100vw" onError={fail} style={{ objectPosition: frame.focalPosition }} /> : null}
      {source.kind === "video" && source.url ? <video ref={videoRef} src={source.url} poster={frame.posterUrl} autoPlay muted={!sound} loop={frame.loop} playsInline onLoadedMetadata={(event) => { const savedTime = mediaTimes.current[source.url!]; if (Number.isFinite(savedTime)) event.currentTarget.currentTime = savedTime; }} onError={fail} aria-label={frame.alt} /> : null}
      {source.kind === "empty" || !source.url ? <div className="scene-empty" aria-label="当前节点暂无画面"><Sparkles size={44} /><span>{frame.alt.split("：")[0]}</span></div> : null}
    </div>
  </div>;
}

export function StoryPlayer({ story }: { story: StoryDetail }) {
  const playerRef = useRef<HTMLElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interludeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preparingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const mediaTimesRef = useRef<Record<string, number>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const readyImageCacheRef = useRef(new Map<string, Promise<boolean>>());
  const activeFrameRef = useRef<VisualFrame | null>(null);
  const visualTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visualRequestTokenRef = useRef(0);
  const visualPhaseRef = useRef<"loading" | "animating" | null>(null);
  const queuedGalleryRef = useRef<QueuedGallery | null>(null);
  const routedConditionRef = useRef<string | undefined>(undefined);
  const audioElementsRef = useRef(new Map<string, HTMLAudioElement>());
  const audioFadeTimersRef = useRef(new Map<string, ReturnType<typeof setInterval>>());
  const narrationFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialVariables = useMemo(() => Object.fromEntries(story.graph.variables.map((variable) => [variable.key, variable.initialValue])), [story]);
  const nodes = useMemo(() => new Map(story.graph.nodes.map((node) => [node.id, node])), [story]);
  const [currentId, setCurrentId] = useState(story.graph.startNodeId);
  const [variables, setVariables] = useState<VariableState>(initialVariables);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [mediaIndex, setMediaIndex] = useState(0);
  const initialNode = nodes.get(story.graph.startNodeId)!;
  const [activeFrame, setActiveFrame] = useState<VisualFrame>(() => frameForNode(story, initialNode, 0));
  const [outgoingFrame, setOutgoingFrame] = useState<VisualFrame>();
  const [visualTransition, setVisualTransition] = useState<VisualTransition>();
  const [drawer, setDrawer] = useState<DrawerName>();
  const [pureView, setPureView] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [audioPromptDismissed, setAudioPromptDismissed] = useState(false);
  const [notice, setNotice] = useState("");
  const [visibleParagraphs, setVisibleParagraphs] = useState(0);
  const [choicesReady, setChoicesReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>();
  const [feedback, setFeedback] = useState("");
  const [isPreparingFrame, setIsPreparingFrame] = useState(false);
  const [resumePrompt, setResumePrompt] = useState(false);
  const [narrationState, setNarrationState] = useState<NarrationState>(() => hasNarration(initialNode) ? "waiting" : "none");

  const current = nodes.get(currentId) as StoryNode | undefined;
  const choices = useMemo(() => (current?.choices ?? []).filter((choice) => (choice.conditions ?? []).every((condition) => passes(condition, variables))), [current, variables]);
  const paragraphs = useMemo(() => (current?.content ?? "").split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean), [current]);
  const visualMedia = useMemo(() => (current?.media ?? []).filter((media) => (media.kind === "image" || media.kind === "video") && (!media.role || media.role === "scene")), [current]);
  const audioMedia = useMemo(() => (current?.media ?? []).filter((media) => media.kind === "audio"), [current]);
  const voiceMedia = useMemo(() => audioMedia.find((media) => media.role === "voice"), [audioMedia]);
  const narrationActive = Boolean(voiceMedia) && (narrationState === "waiting" || narrationState === "playing");
  const isInterlude = current?.type === "scene" && !choices.length && Boolean(current.nextNodeId);
  const selectedMedia = visualMedia[mediaIndex] ?? visualMedia[0];
  const hasAudio = story.graph.nodes.some((node) => node.media?.some((media) => media.kind === "audio"));
  const remainingSteps = current ? distanceToEnding(current.id, nodes) : 1;
  const progress = current?.type === "ending" ? 100 : Math.min(95, Math.max(3, Math.round(((history.length + 1) / (history.length + remainingSteps + 2)) * 100)));
  const experienceRevision = ["after-school-wind", "evening-breeze-says", "mist-catch-last-lamp"].includes(story.slug) ? "v2" : "v1";
  const progressKey = `storyloom:experience:${story.slug}:${experienceRevision}`;
  const preferenceKey = `storyloom:player-preferences:${story.slug}`;
  const style = { "--story-font-scale": preferences.fontScale, "--story-overlay-opacity": preferences.overlayOpacity } as CSSProperties;

  const saveProgress = useCallback((value: SavedExperience) => {
    const mediaTimes = { ...mediaTimesRef.current };
    for (const [url, element] of audioElementsRef.current) if (Number.isFinite(element.currentTime)) mediaTimes[url] = element.currentTime;
    if (selectedMedia?.kind === "video" && videoRef.current && Number.isFinite(videoRef.current.currentTime)) mediaTimes[selectedMedia.url] = videoRef.current.currentTime;
    mediaTimesRef.current = mediaTimes;
    try { localStorage.setItem(progressKey, JSON.stringify({ ...value, mediaTimes })); } catch { /* Storage can be unavailable in private contexts. */ }
  }, [progressKey, selectedMedia]);

  const prepareImage = useCallback((url: string) => {
    const cached = readyImageCacheRef.current.get(url);
    if (cached) return cached;
    const readiness = new Promise<boolean>((resolve) => {
      const image = new window.Image();
      let settled = false;
      const finish = (ready: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        image.onload = null;
        image.onerror = null;
        resolve(ready);
      };
      const timeout = window.setTimeout(() => finish(false), 3000);
      image.onload = () => {
        if (typeof image.decode === "function") void image.decode().then(() => finish(true)).catch(() => finish(true));
        else finish(true);
      };
      image.onerror = () => finish(false);
      image.src = url;
      if (image.complete && image.naturalWidth > 0) finish(true);
    });
    if (readyImageCacheRef.current.size >= 24) {
      const oldest = readyImageCacheRef.current.keys().next().value as string | undefined;
      if (oldest) readyImageCacheRef.current.delete(oldest);
    }
    readyImageCacheRef.current.set(url, readiness);
    void readiness.then((ready) => {
      if (!ready && readyImageCacheRef.current.get(url) === readiness) readyImageCacheRef.current.delete(url);
    });
    return readiness;
  }, []);

  const prepareVideo = useCallback((url: string) => new Promise<boolean>((resolve) => {
    const video = document.createElement("video");
    let settled = false;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      video.oncanplay = null;
      video.onerror = null;
      video.removeAttribute("src");
      video.load();
      resolve(ready);
    };
    const timeout = window.setTimeout(() => finish(false), 3000);
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.oncanplay = () => finish(true);
    video.onerror = () => finish(false);
    video.src = url;
    video.load();
  }), []);

  const prepareFrame = useCallback(async (node: StoryNode, requestedIndex: number) => {
    const media = (node.media ?? []).filter((item) => (item.kind === "image" || item.kind === "video") && (!item.role || item.role === "scene"));
    const selected = media[requestedIndex] ?? media[0];
    const index = selected ? Math.max(0, media.indexOf(selected)) : 0;
    const selectedUrl = playbackUrl(selected);
    const coverReadiness = story.coverUrl && story.coverUrl !== selectedUrl ? prepareImage(story.coverUrl) : Promise.resolve(false);
    if (selected?.kind === "image" && selectedUrl && await prepareImage(selectedUrl)) return frameForNode(story, node, index, selectedUrl);
    if (selected?.kind === "video") {
      const poster = selected.posterUrl ?? story.coverUrl;
      const posterReadiness = poster ? prepareImage(poster) : Promise.resolve(false);
      const videoReadiness = prepareVideo(selected.url);
      const firstReady = await Promise.race([posterReadiness, videoReadiness]);
      if (firstReady) return frameForNode(story, node, index, selected.url);
      const [posterReady, videoReady] = await Promise.all([posterReadiness, videoReadiness]);
      if (posterReady || videoReady) return frameForNode(story, node, index, selected.url);
    }
    if (story.coverUrl && await coverReadiness) return frameForNode(story, node, index, story.coverUrl);
    return frameForNode(story, node, index, undefined, true);
  }, [prepareImage, prepareVideo, story]);

  const requestGalleryRef = useRef<(index: number, direction: -1 | 1) => void>(() => undefined);

  const completeFrameTransition = useCallback((frame: VisualFrame, transition: Omit<VisualTransition, "duration">, commit: () => void) => {
    const previous = activeFrameRef.current;
    const duration = transitionDuration(transition.style, preferences.reducedMotion, transition.kind);
    activeFrameRef.current = frame;
    commit();
    if (!previous || previous.key === frame.key || duration === 0) {
      setOutgoingFrame(undefined);
      setVisualTransition(undefined);
      setActiveFrame(frame);
      visualPhaseRef.current = null;
      const queued = queuedGalleryRef.current;
      queuedGalleryRef.current = null;
      if (queued) requestGalleryRef.current(queued.index, queued.direction);
      return;
    }
    setOutgoingFrame(previous);
    setActiveFrame(frame);
    setVisualTransition({ ...transition, duration });
    visualPhaseRef.current = "animating";
    if (visualTransitionTimerRef.current) clearTimeout(visualTransitionTimerRef.current);
    visualTransitionTimerRef.current = setTimeout(() => {
      setOutgoingFrame(undefined);
      setVisualTransition(undefined);
      visualPhaseRef.current = null;
      const queued = queuedGalleryRef.current;
      queuedGalleryRef.current = null;
      if (queued) requestGalleryRef.current(queued.index, queued.direction);
    }, duration);
  }, [preferences.reducedMotion]);

  const requestGallery = useCallback((requestedIndex: number, direction: -1 | 1) => {
    if (!current || locked || visualMedia.length < 2) return;
    const nextIndex = (requestedIndex + visualMedia.length) % visualMedia.length;
    if (nextIndex === mediaIndex && !visualPhaseRef.current) return;
    if (visualPhaseRef.current === "loading") {
      queuedGalleryRef.current = { index: nextIndex, direction };
      visualRequestTokenRef.current += 1;
      visualPhaseRef.current = null;
      queueMicrotask(() => {
        const queued = queuedGalleryRef.current;
        queuedGalleryRef.current = null;
        if (queued) requestGalleryRef.current(queued.index, queued.direction);
      });
      return;
    }
    if (visualPhaseRef.current === "animating") {
      queuedGalleryRef.current = { index: nextIndex, direction };
      return;
    }
    visualPhaseRef.current = "loading";
    const token = ++visualRequestTokenRef.current;
    if (preparingTimerRef.current) clearTimeout(preparingTimerRef.current);
    preparingTimerRef.current = setTimeout(() => {
      if (token === visualRequestTokenRef.current) setIsPreparingFrame(true);
    }, 150);
    void prepareFrame(current, nextIndex).then((frame) => {
      if (token !== visualRequestTokenRef.current) return;
      if (preparingTimerRef.current) clearTimeout(preparingTimerRef.current);
      setIsPreparingFrame(false);
      completeFrameTransition(frame, { kind: "gallery", style: "fade", direction }, () => {
        setMediaIndex(frame.mediaIndex);
        saveProgress({ currentId, variables, history, mediaIndex: frame.mediaIndex, savedAt: new Date().toISOString() });
      });
    });
  }, [completeFrameTransition, current, currentId, history, locked, mediaIndex, prepareFrame, saveProgress, variables, visualMedia.length]);

  useEffect(() => {
    requestGalleryRef.current = requestGallery;
  }, [requestGallery]);

  const persistAndMove = useCallback((targetNodeId: string, nextVariables: VariableState, nextHistory: HistoryEntry[]) => {
    const targetNode = nodes.get(targetNodeId);
    if (!targetNode) { setLocked(false); return; }
    window.setTimeout(() => saveProgress({ currentId: targetNodeId, variables: nextVariables, history: nextHistory, mediaIndex: 0, savedAt: new Date().toISOString() }), 0);
    if (visualTransitionTimerRef.current) clearTimeout(visualTransitionTimerRef.current);
    setOutgoingFrame(undefined);
    setVisualTransition(undefined);
    queuedGalleryRef.current = null;
    visualPhaseRef.current = "loading";
    const token = ++visualRequestTokenRef.current;
    if (preparingTimerRef.current) clearTimeout(preparingTimerRef.current);
    preparingTimerRef.current = setTimeout(() => {
      if (token === visualRequestTokenRef.current) setIsPreparingFrame(true);
    }, 150);
    void prepareFrame(targetNode, 0).then((frame) => {
      if (token !== visualRequestTokenRef.current) return;
      if (preparingTimerRef.current) clearTimeout(preparingTimerRef.current);
      setIsPreparingFrame(false);
      completeFrameTransition(frame, { kind: "node", style: targetNode.presentation?.transition ?? "dissolve", direction: 0 }, () => {
        setVariables(nextVariables);
        setHistory(nextHistory);
        setMediaIndex(frame.mediaIndex);
        setNarrationState(hasNarration(targetNode) ? "waiting" : "none");
        setCurrentId(targetNodeId);
      });
    });
  }, [completeFrameTransition, nodes, prepareFrame, saveProgress]);

  const continueTo = useCallback((target: string) => {
    if (locked) return;
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback("");
    setLocked(true);
    persistAndMove(target, variables, [...history, { nodeId: currentId, variables: { ...variables }, mediaIndex }]);
  }, [currentId, history, locked, mediaIndex, persistAndMove, variables]);

  const revealAll = useCallback(() => {
    setVisibleParagraphs(paragraphs.length);
    setChoicesReady(true);
  }, [paragraphs.length]);

  const finishNarration = useCallback((state: Extract<NarrationState, "finished" | "skipped" | "failed">) => {
    if (narrationFallbackTimerRef.current) {
      clearTimeout(narrationFallbackTimerRef.current);
      narrationFallbackTimerRef.current = null;
    }
    setNarrationState(state);
    setVisibleParagraphs(paragraphs.length);
    setChoicesReady(true);
  }, [paragraphs.length]);

  const skipNarration = useCallback(() => {
    if (!voiceMedia) return;
    const element = audioElementsRef.current.get(voiceMedia.url);
    if (element) {
      element.pause();
      element.currentTime = 0;
    }
    finishNarration("skipped");
  }, [finishNarration, voiceMedia]);

  const wakeControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!drawer && !resumePrompt) setControlsVisible(false);
    }, 3000);
  }, [drawer, resumePrompt]);

  useEffect(() => {
    const supportTimer = setTimeout(() => setFullscreenSupported(Boolean(document.fullscreenEnabled)), 0);
    const fullscreenListener = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", fullscreenListener);
    return () => { clearTimeout(supportTimer); document.removeEventListener("fullscreenchange", fullscreenListener); };
  }, []);

  useEffect(() => {
    activeFrameRef.current = activeFrame;
  }, [activeFrame]);

  useEffect(() => {
    let cancelled = false;
    const restoreTimer = setTimeout(() => {
      try {
        const storedPreferences = localStorage.getItem(preferenceKey);
        if (storedPreferences) setPreferences({ ...defaultPreferences, ...JSON.parse(storedPreferences) as Partial<PlayerPreferences> });
        else if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPreferences((value) => ({ ...value, reducedMotion: true }));
        const storedProgress = localStorage.getItem(progressKey);
        if (storedProgress) {
          const saved = JSON.parse(storedProgress) as SavedExperience;
          if (nodes.has(saved.currentId)) {
            const savedNode = nodes.get(saved.currentId)!;
            void prepareFrame(savedNode, saved.mediaIndex ?? 0).then((frame) => {
              if (cancelled) return;
              activeFrameRef.current = frame;
              setActiveFrame(frame);
              setNarrationState(hasNarration(savedNode) ? "waiting" : "none");
              setCurrentId(saved.currentId);
              setVariables(saved.variables);
              setHistory(saved.history);
              setMediaIndex(frame.mediaIndex);
              mediaTimesRef.current = saved.mediaTimes ?? {};
              setResumePrompt(true);
            });
          }
        }
      } catch { /* Invalid old preferences or progress are ignored. */ }
    }, 0);
    return () => { cancelled = true; clearTimeout(restoreTimer); };
  }, [nodes, preferenceKey, prepareFrame, progressKey]);

  useEffect(() => {
    const instant = preferences.reducedMotion || current?.presentation?.textReveal === "instant";
    const resetTimer = setTimeout(() => {
      setLocked(false);
      setSelectedChoiceId(undefined);
      if (voiceMedia) {
        setNarrationState("waiting");
        setVisibleParagraphs(0);
        setChoicesReady(false);
      } else {
        setNarrationState("none");
        setVisibleParagraphs(instant ? paragraphs.length : 0);
        setChoicesReady(instant || !paragraphs.length);
      }
    }, 0);
    const timers = instant || voiceMedia ? [] : paragraphs.map((_, index) => setTimeout(() => {
      setVisibleParagraphs(index + 1);
      if (index === paragraphs.length - 1) setChoicesReady(true);
    }, Math.min(1200, 120 + index * 220)));
    return () => { clearTimeout(resetTimer); timers.forEach(clearTimeout); };
  }, [currentId, current?.presentation?.textReveal, paragraphs, preferences.reducedMotion, voiceMedia]);

  useEffect(() => {
    if (current?.type !== "condition" || locked || !choicesReady) return;
    const route = choices[0];
    if (!route || routedConditionRef.current === current.id) return;
    routedConditionRef.current = current.id;
    const timer = window.setTimeout(() => {
      const nextVariables = applyChanges(variables, route.changes);
      const nextHistory = [...history, { nodeId: currentId, variables: { ...variables }, mediaIndex }];
      setLocked(true);
      persistAndMove(route.targetNodeId, nextVariables, nextHistory);
    }, 0);
    return () => clearTimeout(timer);
  }, [choices, choicesReady, current, currentId, history, locked, mediaIndex, persistAndMove, variables]);

  useEffect(() => {
    if (document.hidden) return;
    const urls = choices.map((choice) => (nodes.get(choice.targetNodeId)?.media ?? []).find((media) => (media.kind === "image" || media.kind === "video") && (!media.role || media.role === "scene"))).map((media) => media?.kind === "video" ? media.posterUrl : playbackUrl(media)).filter((url): url is string => Boolean(url));
    for (const url of urls) void prepareImage(url);
  }, [choices, nodes, prepareImage]);

  useEffect(() => {
    if (document.hidden || visualMedia.length < 2) return;
    const adjacent = [visualMedia[(mediaIndex - 1 + visualMedia.length) % visualMedia.length], visualMedia[(mediaIndex + 1) % visualMedia.length]];
    for (const media of adjacent) {
      const url = media.kind === "video" ? media.posterUrl : playbackUrl(media);
      if (url) void prepareImage(url);
    }
  }, [mediaIndex, prepareImage, visualMedia]);

  useEffect(() => {
    if (interludeTimerRef.current) clearTimeout(interludeTimerRef.current);
    if (!isInterlude || !current?.nextNodeId || locked || !choicesReady) return;
    const frameDuration = preferences.reducedMotion ? 0 : 3000;
    const imageCount = Math.max(1, visualMedia.length);
    const contentLength = current.content.replace(/\s/g, "").length;
    const readingDuration = current.speaker === "章节"
      ? 3200
      : Math.max(5200, Math.min(12000, contentLength * 85));
    let imageTimer: ReturnType<typeof setInterval> | null = null;
    if (imageCount > 1 && !preferences.reducedMotion) {
      let nextIndex = activeFrameRef.current?.mediaIndex ?? 0;
      imageTimer = setInterval(() => {
        nextIndex = (nextIndex + 1) % imageCount;
        requestGallery(nextIndex, 1);
      }, frameDuration);
    }
    interludeTimerRef.current = setTimeout(
      () => continueTo(current.nextNodeId!),
      Math.max(readingDuration, frameDuration * imageCount + 900),
    );
    return () => {
      if (interludeTimerRef.current) clearTimeout(interludeTimerRef.current);
      if (imageTimer) clearInterval(imageTimer);
    };
  }, [choicesReady, continueTo, current, isInterlude, locked, preferences.reducedMotion, requestGallery, visualMedia.length]);

  useEffect(() => {
    const playableAudio = audioMedia.filter((media) => media.role !== "voice" || narrationState === "waiting" || narrationState === "playing");
    const activeUrls = new Set(playableAudio.map((media) => media.url));
    const listenerCleanups: Array<() => void> = [];
    const fadeTo = (url: string, element: HTMLAudioElement, target: number, duration: number, onDone?: () => void) => {
      const existingTimer = audioFadeTimersRef.current.get(url);
      if (existingTimer) clearInterval(existingTimer);
      const startVolume = element.volume;
      const startedAt = Date.now();
      const timer = setInterval(() => {
        const ratio = Math.min(1, (Date.now() - startedAt) / duration);
        element.volume = Math.max(0, Math.min(1, startVolume + (target - startVolume) * ratio));
        if (ratio >= 1) {
          clearInterval(timer);
          audioFadeTimersRef.current.delete(url);
          onDone?.();
        }
      }, 50);
      audioFadeTimersRef.current.set(url, timer);
    };
    for (const [url, element] of audioElementsRef.current) {
      if (!preferences.sound || !activeUrls.has(url)) {
        fadeTo(url, element, 0, preferences.reducedMotion ? 50 : 700, () => {
          element.pause();
          if (!activeUrls.has(url)) audioElementsRef.current.delete(url);
        });
      }
    }
    if (!preferences.sound) return;
    for (const media of playableAudio) {
      let element = audioElementsRef.current.get(media.url);
      if (!element) {
        element = new Audio(media.url);
        element.preload = "auto";
        element.volume = 0;
        const savedTime = mediaTimesRef.current[media.url];
        if (media.role !== "voice" && Number.isFinite(savedTime)) {
          const restoreTime = () => { if (element) element.currentTime = savedTime; };
          if (element.readyState >= 1) restoreTime();
          else element.addEventListener("loadedmetadata", restoreTime, { once: true });
        }
        audioElementsRef.current.set(media.url, element);
      }
      element.loop = media.loop ?? (media.role === "music" || media.role === "ambience");
      if (media.role === "voice" && narrationState === "waiting") element.currentTime = 0;
      const targetVolume = Math.max(0, Math.min(1, media.volume ?? .55));
      if (media.role === "voice") {
        const narrationElement = element;
        const handleEnded = () => finishNarration("finished");
        const handleError = () => {
          setNotice("旁白加载失败，已切换为阅读模式");
          finishNarration("failed");
        };
        narrationElement.addEventListener("ended", handleEnded);
        narrationElement.addEventListener("error", handleError);
        listenerCleanups.push(() => {
          narrationElement.removeEventListener("ended", handleEnded);
          narrationElement.removeEventListener("error", handleError);
        });
        if (narrationFallbackTimerRef.current) clearTimeout(narrationFallbackTimerRef.current);
        narrationFallbackTimerRef.current = setTimeout(handleError, 12000);
      }
      void element.play().then(() => {
        if (media.role === "voice") {
          if (narrationFallbackTimerRef.current) {
            clearTimeout(narrationFallbackTimerRef.current);
            narrationFallbackTimerRef.current = null;
          }
          setNarrationState("playing");
        }
        fadeTo(media.url, element, targetVolume, preferences.reducedMotion ? 50 : 800);
      }).catch(() => {
        if (media.role === "voice") setNarrationState("waiting");
        setAudioPromptDismissed(false);
      });
    }
    return () => listenerCleanups.forEach((cleanup) => cleanup());
  }, [audioMedia, finishNarration, narrationState, preferences.reducedMotion, preferences.sound]);

  useEffect(() => {
    const handleVisibility = () => {
      for (const element of audioElementsRef.current.values()) {
        if (document.hidden) element.pause();
        else if (preferences.sound) void element.play().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [preferences.sound]);

  useEffect(() => {
    if (!drawer) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusTimer = setTimeout(() => drawerRef.current?.focus(), 0);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawer(undefined);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", closeOnEscape);
      previouslyFocused?.focus();
    };
  }, [drawer]);

  useEffect(() => () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (interludeTimerRef.current) clearTimeout(interludeTimerRef.current);
    if (preparingTimerRef.current) clearTimeout(preparingTimerRef.current);
    if (visualTransitionTimerRef.current) clearTimeout(visualTransitionTimerRef.current);
    if (narrationFallbackTimerRef.current) clearTimeout(narrationFallbackTimerRef.current);
    visualRequestTokenRef.current += 1;
    for (const timer of audioFadeTimersRef.current.values()) clearInterval(timer);
    for (const element of audioElementsRef.current.values()) { element.pause(); element.src = ""; }
  }, []);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, select, textarea")) return;
      wakeControls();
      if (narrationActive && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        return;
      }
      if (isInterlude && current?.nextNodeId && (event.key === " " || event.key === "Enter")) { event.preventDefault(); continueTo(current.nextNodeId); return; }
      if ((event.key === " " || event.key === "Enter") && !choicesReady) { event.preventDefault(); revealAll(); }
      if (event.key === "ArrowLeft" && visualMedia.length > 1) requestGallery(mediaIndex - 1, -1);
      if (event.key === "ArrowRight" && visualMedia.length > 1) requestGallery(mediaIndex + 1, 1);
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [choicesReady, continueTo, current, isInterlude, mediaIndex, narrationActive, requestGallery, revealAll, visualMedia.length, wakeControls]);

  if (!current) return <main className="immersive-player missing-scene"><p>当前剧情节点不存在。</p><Link href="/workshop">返回创意工坊</Link></main>;

  function choose(choice: StoryChoice) {
    if (locked) return;
    const nextVariables = applyChanges(variables, choice.changes);
    const nextHistory = [...history, { nodeId: currentId, variables: { ...variables }, choiceLabel: choice.label, mediaIndex }];
    setLocked(true);
    setSelectedChoiceId(choice.id);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    const feedbackText = choice.feedback ?? "";
    setFeedback(feedbackText);
    if (feedbackText) feedbackTimerRef.current = setTimeout(() => setFeedback(""), Math.max(1000, Math.min(1800, feedbackText.length * 65)));
    if (preferences.haptics && navigator.vibrate) navigator.vibrate(choice.importance === "key" ? 22 : 10);
    persistAndMove(choice.targetNodeId, nextVariables, nextHistory);
  }

  function jump(index: number) {
    const entry = history[index];
    const nextHistory = history.slice(0, index);
    setDrawer(undefined);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback("");
    setIsPreparingFrame(false);
    setLocked(true);
    saveProgress({ currentId: entry.nodeId, variables: entry.variables, history: nextHistory, mediaIndex: entry.mediaIndex ?? 0, savedAt: new Date().toISOString() });
    const targetNode = nodes.get(entry.nodeId);
    if (!targetNode) return;
    visualPhaseRef.current = "loading";
    queuedGalleryRef.current = null;
    const token = ++visualRequestTokenRef.current;
    void prepareFrame(targetNode, entry.mediaIndex ?? 0).then((frame) => {
      if (token !== visualRequestTokenRef.current) return;
      completeFrameTransition(frame, { kind: "node", style: targetNode.presentation?.transition ?? "dissolve", direction: 0 }, () => {
        setNarrationState(hasNarration(targetNode) ? "waiting" : "none");
        setCurrentId(entry.nodeId);
        setVariables(entry.variables);
        setHistory(nextHistory);
        setMediaIndex(frame.mediaIndex);
        setLocked(false);
      });
    });
  }

  function restart() {
    mediaTimesRef.current = {};
    setResumePrompt(false);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback("");
    setIsPreparingFrame(false);
    setLocked(true);
    try { localStorage.removeItem(progressKey); } catch { /* Optional storage. */ }
    const targetNode = nodes.get(story.graph.startNodeId);
    if (!targetNode) return;
    visualPhaseRef.current = "loading";
    queuedGalleryRef.current = null;
    const token = ++visualRequestTokenRef.current;
    void prepareFrame(targetNode, 0).then((frame) => {
      if (token !== visualRequestTokenRef.current) return;
      completeFrameTransition(frame, { kind: "node", style: targetNode.presentation?.transition ?? "dissolve", direction: 0 }, () => {
        setNarrationState(hasNarration(targetNode) ? "waiting" : "none");
        setCurrentId(story.graph.startNodeId);
        setVariables(initialVariables);
        setHistory([]);
        setMediaIndex(frame.mediaIndex);
        setLocked(false);
      });
    });
  }

  async function shareStory() {
    const shareData = { title: story.title, text: story.summary, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(window.location.href); setNotice("剧情链接已复制"); }
    } catch { /* Closing the native share panel is not an error. */ }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await playerRef.current?.requestFullscreen();
    } catch { setNotice("当前浏览器无法进入原生全屏"); }
  }

  function setPreference<K extends keyof PlayerPreferences>(key: K, value: PlayerPreferences[K]) {
    setPreferences((currentPreferences) => {
      const nextPreferences = { ...currentPreferences, [key]: value };
      try { localStorage.setItem(preferenceKey, JSON.stringify(nextPreferences)); } catch { /* Preference persistence is optional. */ }
      return nextPreferences;
    });
  }

  function handleStageClick(event: React.MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("button, a, .player-drawer")) return;
    if (!isInterlude && (event.target as HTMLElement).closest(".cinematic-dialogue")) return;
    wakeControls();
    if (narrationActive) return;
    if (isInterlude && current.nextNodeId) { continueTo(current.nextNodeId); return; }
    if (pureView) setPureView(false);
    else if (!choicesReady) revealAll();
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLElement>) {
    if (touchStartRef.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStartRef.current;
    touchStartRef.current = null;
    if (visualMedia.length > 1 && Math.abs(distance) > 50) requestGallery(distance < 0 ? mediaIndex + 1 : mediaIndex - 1, distance < 0 ? 1 : -1);
  }

  const sceneTransitionStyle = {
    "--scene-transition-ms": `${visualTransition?.duration ?? 0}ms`,
    "--scene-direction": visualTransition?.direction ?? 0,
  } as CSSProperties;

  return (
    <main ref={playerRef} style={style} className={`immersive-player player-${story.slug === "evening-breeze-says" ? "rose" : "rain"} fit-${preferences.fit} ${controlsVisible ? "controls-visible" : "controls-hidden"} ${pureView ? "pure-view" : ""} ${isPreparingFrame ? "scene-preparing" : ""} ${preferences.highContrast ? "high-contrast" : ""} ${preferences.reducedMotion ? "reduce-motion" : ""}`} onMouseMove={wakeControls} onTouchStart={(event) => { touchStartRef.current = event.touches[0].clientX; wakeControls(); }} onTouchEnd={handleTouchEnd} onClick={handleStageClick}>
      <div className={`scene-stack ${visualTransition ? `scene-transition-${visualTransition.kind} scene-transition-${visualTransition.style}` : ""}`} style={sceneTransitionStyle}>
        {outgoingFrame ? <SceneFrameView key={outgoingFrame.key} frame={outgoingFrame} phase="outgoing" sound={preferences.sound} mediaTimes={mediaTimesRef} /> : null}
        <SceneFrameView key={activeFrame.key} frame={activeFrame} phase={visualTransition ? "incoming" : "active"} sound={preferences.sound} videoRef={videoRef} mediaTimes={mediaTimesRef} />
      </div>
      <div className="scene-shade" aria-hidden="true" />
      <div className="story-progress" aria-label={`剧情进度约 ${progress}%`}><i style={{ width: `${progress}%` }} /></div>

      <header className="immersive-toolbar" inert={Boolean(drawer) ? true : undefined}>
        <div className="toolbar-leading"><Link href="/workshop" aria-label="退出剧情"><ArrowLeft size={19} /></Link><div><strong>{story.title}</strong><small>{current.type === "ending" ? "结局" : current.title}</small></div></div>
        <nav>
          <button onClick={() => setDrawer(drawer === "variables" ? undefined : "variables")} aria-label="查看故事状态" aria-expanded={drawer === "variables"}><SlidersHorizontal size={18} /></button>
          <button onClick={() => setDrawer(drawer === "history" ? undefined : "history")} aria-label="查看走过的分支" aria-expanded={drawer === "history"}><History size={18} /></button>
          <button className={preferences.sound ? "active" : ""} onClick={() => {
            if (preferences.sound && narrationActive) skipNarration();
            setPreference("sound", !preferences.sound);
            setAudioPromptDismissed(true);
          }} aria-label={preferences.sound ? "关闭声音" : "开启声音"}>{preferences.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
          <button onClick={() => setPreference("fit", preferences.fit === "cover" ? "contain" : "cover")} aria-label={preferences.fit === "cover" ? "查看完整画面" : "铺满屏幕"}>{preferences.fit === "cover" ? <ImageIcon size={18} /> : <Fullscreen size={18} />}</button>
          {fullscreenSupported ? <button onClick={toggleFullscreen} aria-label={isFullscreen ? "退出原生全屏" : "进入原生全屏"}>{isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button> : null}
          <button onClick={() => setPureView(true)} aria-label="进入纯画面模式"><EyeOff size={18} /></button>
          <button onClick={() => setDrawer(drawer === "settings" ? undefined : "settings")} aria-label="更多体验设置" aria-expanded={drawer === "settings"}><MoreHorizontal size={18} /></button>
        </nav>
      </header>

      {narrationActive ? <button className="narration-skip" onClick={(event) => { event.stopPropagation(); skipNarration(); wakeControls(); }}><SkipForward size={17} />跳过旁白</button> : null}
      {pureView ? <button className="exit-pure-view" onClick={(event) => { event.stopPropagation(); setPureView(false); wakeControls(); }}><Eye size={17} />显示剧情界面</button> : null}
      {notice ? <div className="immersive-notice" role="status">{notice}</div> : null}
      {feedback && !pureView ? <div className="transition-feedback" role="status"><Sparkles size={15} />{feedback}</div> : null}
      {hasAudio && !preferences.sound && !audioPromptDismissed && !pureView ? <div className="audio-invite" inert={Boolean(drawer) ? true : undefined}><Headphones size={17} /><span>{voiceMedia ? "点击开始播放本段旁白" : "开启声音，进入完整故事氛围"}</span><button onClick={() => { setPreference("sound", true); setAudioPromptDismissed(true); }}>{voiceMedia ? "开始旁白" : "开启"}</button><button aria-label={voiceMedia ? "跳过旁白" : "暂不开启"} onClick={() => { setAudioPromptDismissed(true); if (voiceMedia) skipNarration(); }}><X size={15} /></button></div> : null}

      {visualMedia.length > 1 && !pureView ? <div className="media-switcher" inert={Boolean(drawer) ? true : undefined}><button disabled={locked} onClick={() => requestGallery(mediaIndex - 1, -1)} aria-label="上一幅画面"><ChevronLeft size={19} /></button><div>{visualMedia.map((media, index) => <button key={`${media.url}-${index}`} disabled={locked} className={index === mediaIndex ? "active" : ""} onClick={() => requestGallery(index, index >= mediaIndex ? 1 : -1)} aria-label={`查看第 ${index + 1} 幅画面`} aria-current={index === mediaIndex ? "true" : undefined} />)}</div><button disabled={locked} onClick={() => requestGallery(mediaIndex + 1, 1)} aria-label="下一幅画面"><ChevronRight size={19} /></button></div> : null}

      {drawer ? <button className="drawer-scrim" tabIndex={-1} aria-label="关闭体验面板" onClick={() => setDrawer(undefined)} /> : null}
      {drawer === "variables" ? <aside ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="故事状态" className="player-drawer variable-drawer"><div className="drawer-heading"><strong>故事状态</strong><button onClick={() => setDrawer(undefined)} aria-label="关闭状态面板"><X size={17} /></button></div><p>数值默认隐藏，避免打断剧情判断。</p>{story.graph.variables.map((definition) => { const value = variables[definition.key]; const numeric = typeof value === "number" ? value : 0; const ratio = definition.max ? Math.max(0, Math.min(100, numeric / definition.max * 100)) : 0; return <div className="immersive-variable" key={definition.key}><span><b>{definition.label}</b><small>{preferences.showValues ? String(value) : "状态已记录"}</small></span>{definition.type === "number" ? <i><b style={{ width: `${ratio}%` }} /></i> : null}</div>; })}<button className="drawer-toggle" onClick={() => setPreference("showValues", !preferences.showValues)}>{preferences.showValues ? "隐藏具体数值" : "显示具体数值"}</button></aside> : null}

      {drawer === "history" ? <aside ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="走过的分支" className="player-drawer history-drawer"><div className="drawer-heading"><strong>走过的分支</strong><button onClick={() => setDrawer(undefined)} aria-label="关闭分支面板"><X size={17} /></button></div><p>返回后，之后的选择和状态会一同恢复。</p>{history.length ? history.map((entry, index) => <button className="history-entry" key={`${entry.nodeId}-${index}`} onClick={() => jump(index)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{nodes.get(entry.nodeId)?.title}</strong><small>{entry.choiceLabel ?? "继续剧情"}</small></div><ChevronRight size={15} /></button>) : <div className="drawer-empty">你还没有做出第一个选择。</div>}</aside> : null}

      {drawer === "settings" ? <aside ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="体验设置" className="player-drawer settings-drawer"><div className="drawer-heading"><strong>体验设置</strong><button onClick={() => setDrawer(undefined)} aria-label="关闭设置"><X size={17} /></button></div><div className="setting-row"><span>字号</span><span><button aria-label="减小字号" onClick={() => setPreference("fontScale", Math.max(.85, preferences.fontScale - .1))}>－</button><b aria-live="polite">{Math.round(preferences.fontScale * 100)}%</b><button aria-label="增大字号" onClick={() => setPreference("fontScale", Math.min(1.35, preferences.fontScale + .1))}>＋</button></span></div><label>字幕背景 <input aria-label="字幕背景透明度" type="range" min="0.55" max="1" step="0.05" value={preferences.overlayOpacity} onChange={(event) => setPreference("overlayOpacity", Number(event.target.value))} /></label><label className="switch-row"><span>高对比度</span><input type="checkbox" checked={preferences.highContrast} onChange={(event) => setPreference("highContrast", event.target.checked)} /></label><label className="switch-row"><span>降低动态效果</span><input type="checkbox" checked={preferences.reducedMotion} onChange={(event) => setPreference("reducedMotion", event.target.checked)} /></label><label className="switch-row"><span>触觉反馈</span><input type="checkbox" checked={preferences.haptics} onChange={(event) => setPreference("haptics", event.target.checked)} /></label><button className="drawer-share" onClick={shareStory}><Share2 size={16} />分享剧情</button><Link className="drawer-share" href={`/auth?returnTo=${encodeURIComponent(`/stories/${story.slug}`)}`}><Bookmark size={16} />登录后收藏与跨端同步</Link></aside> : null}

      {!pureView && !narrationActive ? <article className="cinematic-dialogue" aria-live="polite" inert={Boolean(drawer) ? true : undefined}>
        <div className="dialogue-copy" key={currentId}><span>{current.speaker ?? "旁白"}</span><h1>{current.title}</h1><div>{paragraphs.slice(0, visibleParagraphs).map((paragraph, index) => <p key={`${currentId}-${index}`}>{paragraph}</p>)}</div>{!choicesReady ? <button className="reveal-all" onClick={revealAll}>点击显示全部</button> : null}</div>
        {choicesReady && current.type !== "ending" && current.type !== "condition" && choices.length > 0 ? <div className="cinematic-choices">{choices.map((choice, index) => <button key={choice.id} disabled={locked} className={`${selectedChoiceId === choice.id ? "selected" : ""} ${choice.importance === "key" ? "key-choice" : ""}`} onClick={() => choose(choice)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{choice.label}</strong><ChevronRight size={18} /></button>)}</div> : null}
        {isInterlude && choicesReady ? <div className="interlude-skip-hint" role="status">点击画面跳过过场</div> : null}
        {choicesReady && current.type === "ending" ? <div className="immersive-ending"><span><Sparkles size={17} />已抵达结局 · {current.title}</span>{history.length ? <p>你的路线：{history.slice(-4).map((entry) => entry.choiceLabel).filter(Boolean).join(" → ")}</p> : null}<div><button onClick={restart}><RotateCcw size={16} />重新开始</button><Link href="/workshop"><Home size={16} />返回工坊</Link></div></div> : null}
      </article> : null}

      {resumePrompt ? <div className="resume-overlay"><div><span>继续上次的故事</span><h2>{current.title}</h2><p>你的选择和故事状态已经恢复。</p><button onClick={() => setResumePrompt(false)}>继续体验</button><button onClick={restart}>重新开始</button></div></div> : null}
    </main>
  );
}
