// src/server/managers/userSkillManager/index.ts
import { 
    getUserSkills,
    getUserSkillsByUser,
    createUserSkill,
    updateUserSkill,
    getUserSkillsByCategory
  } from '@/server/services/userSkillServices';
  
  export const userSkillManager = {
    getUserSkills,
    getUserSkillsByUser,
    createUserSkill,
    updateUserSkill,
    getUserSkillsByCategory
  };