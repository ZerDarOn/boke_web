/**
 * APlayer 没有官方 TypeScript 类型，这里提供最小可用声明。
 * 仅覆盖本项目用到的构造参数与实例方法。
 */
declare module 'aplayer' {
  export interface APlayerAudio {
    name?: string;
    artist?: string;
    url: string;
    cover?: string;
    lrc?: string;
    theme?: string;
    type?: 'auto' | 'hls' | 'normal';
  }

  export interface APlayerOptions {
    container: HTMLElement;
    audio: APlayerAudio[];
    /** 迷你模式：只显示一个圆形封面，点击展开 */
    mini?: boolean;
    fixed?: boolean;
    autoplay?: boolean;
    theme?: string;
    loop?: 'all' | 'one' | 'none';
    order?: 'list' | 'random';
    preload?: 'none' | 'metadata' | 'auto';
    volume?: number;
    mutex?: boolean;
    listFolded?: boolean;
    listMaxHeight?: string;
    lrcType?: 0 | 1 | 2 | 3;
    storageName?: string;
  }

  export default class APlayer {
    constructor(options: APlayerOptions);
    audio: HTMLAudioElement;
    list: {
      add(audios: APlayerAudio[]): void;
      clear(): void;
      switch(index: number): void;
      index: number;
    };
    play(): void;
    pause(): void;
    toggle(): void;
    seek(time: number): void;
    on(event: string, handler: () => void): void;
    destroy(): void;
  }
}

declare module 'aplayer/dist/APlayer.min.css';
