import * as resourceDefs from './resourceDefs';
import { IResourceBrick } from './types';

// TODO: we me not need this
const nameToResource: { [key: string]: IResourceBrick } = {};
Object.values(resourceDefs).forEach((def) => nameToResource[def.name] = def);

export { IResourceBrick, nameToResource };
export * from './resourceDefs';
