import { User } from "../Models/user.js";
import ErrorHandler from "../Utils/Utility-Class.js";
import { TryCatch } from "./error.js";

export const adminOnly = TryCatch(
    async (req,res,next)=>{
        const {id} = req.query;
        if(!id){
            return next(new ErrorHandler("Please Login First",401))
        }
        const user = await User.findById(id);
        if(!user){
            return next(new ErrorHandler("Invalid User Id",404))
        }
        if(user.role !== "admin"){
            return next(new ErrorHandler("You are not authorized to access this route",403))
        }
        
        next();
    }
)