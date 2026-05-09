

import mongoose from "mongoose";

export default async function connection(){

    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ZINDALEARN';
    const db = await mongoose.connect(MONGO_URI)
    console.log("database created");


    return db
    
}