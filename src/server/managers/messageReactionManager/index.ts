// src/server/managers/messageReactionManager/index.ts
import { 
    addReaction,
    removeReaction,
    getMessageReactions
  } from '@/server/services/messageReactionServices';
  
  export const messageReactionManager = {
    addReaction,
    removeReaction,
    getMessageReactions
  };