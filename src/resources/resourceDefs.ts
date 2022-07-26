import { IResourceBrick } from './types';

// TODO: material types, make non-filler resources glow or something

export const DirtResource: IResourceBrick = {
    name: 'dirt',
    displayName: 'Dirt',
    color: [51, 45, 26],
    // hp: 5,
    hp: 1, // DEBUG
};

export const StoneResource: IResourceBrick = {
    name: 'stone',
    displayName: 'Stone',
    color: [145, 142, 133],
    hp: 5,
};

export const IronResource: IResourceBrick = {
    name: 'iron',
    displayName: 'Iron',
    color: [165, 156, 148],
    hp: 5,
};

export const CopperResource: IResourceBrick = {
    name: 'copper',
    displayName: 'Copper',
    color: [184, 115, 51],
    hp: 5,
};
