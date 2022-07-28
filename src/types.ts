import OmeggaPlugin from 'omegga';

// TODO: define config and storage
export type UMConfig = { foo: string };
export type UMStorage = { bar: string };
export type UMPlugin = OmeggaPlugin<UMConfig, UMStorage>;
