import mongoose from "mongoose";
export interface access {
    _id?: mongoose.ObjectId,
    name: string,
    category: string,
    addedBy: mongoose.ObjectId,
    updatedBy: mongoose.ObjectId,
    isActive:boolean,
    url:string,
    isMenuItem: boolean,
    parent: mongoose.ObjectId,
    order:number,
    icon: string,
} 