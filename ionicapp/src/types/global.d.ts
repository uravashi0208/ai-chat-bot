// Global type definitions for the Ionic Chat App

declare module 'jwt-decode' {
  function jwtDecode<T = any>(token: string): T;
  export = jwtDecode;
}

declare module 'emoji-picker-react' {
  export interface EmojiClickData {
    emoji: string;
    names: string[];
    originalUnified: string;
    unified: string;
  }

  export interface EmojiPickerProps {
    onEmojiClick?: (emojiData: EmojiClickData) => void;
    width?: string | number;
    height?: string | number;
    theme?: 'light' | 'dark' | 'auto';
  }

  const EmojiPicker: React.FC<EmojiPickerProps>;
  export default EmojiPicker;
}

declare module 'react-router-dom' {
  export * from 'react-router-dom';
}

// Environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly REACT_APP_API_URL: string;
    readonly REACT_APP_SOCKET_URL?: string;
  }
}

// Vite environment variables (for compatibility)
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SOCKET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Custom CSS properties for Ionic theming
declare module 'csstype' {
  interface Properties {
    '--ion-color-primary'?: string;
    '--ion-color-primary-rgb'?: string;
    '--ion-color-primary-contrast'?: string;
    '--ion-color-primary-contrast-rgb'?: string;
    '--ion-color-primary-shade'?: string;
    '--ion-color-primary-tint'?: string;
    '--background'?: string;
    '--color'?: string;
    '--border-radius'?: string;
    '--padding-start'?: string;
    '--padding-end'?: string;
    '--padding-top'?: string;
    '--padding-bottom'?: string;
  }
}