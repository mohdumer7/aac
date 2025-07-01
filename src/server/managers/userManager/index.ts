import { getUsers, createUser,updateUser,updateAccess } from "@/server/services/userServices"

export const userManager = {
  getUsers,
  createUser,
  updateAccess,
  updateUser
}
