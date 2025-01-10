import { NextFunction, Request, Response } from "express";
import { User } from "../Models/user.js";
import { NewUserRequstBody } from "../Types/types.js";
import { errorHandler, TryCatch } from "../Middlewares/error.js";
import ErrorHandler from "../Utils/Utility-Class.js";

const newUser = TryCatch(
    async (
        req: Request<{}, {}, NewUserRequstBody>,
        res: Response,
        next: NextFunction
      ) => {
        const { _id, name, email, photo, gender, dob } = req.body;
      
        let user = await User.findById(_id);
        if(user){
            return res.status(200).json({
                success:true,
                message:`Wellcome ${user.name}`
            })
        }
        if(!_id || !name || !email || !photo || !gender || !dob){
           return next(new ErrorHandler("Please Enter all the fields",400))
        }
         user = await User.create({
          _id,
          name,
          email,
          photo,
          gender,
          dob: new Date(dob),
        });
      
        res.status(201).json({
          success: true,
          message: `Wellcome ${user.name}`,
        });
      }
);

const getAllUser = TryCatch(
    async (req,res,next)=>{
        const users = await User.find();
        res.status(200).json({
            success:true,
            users
        })
    }
);

const getUserById = TryCatch(
    async (req,res,next)=>{
        const user = await User.findById(req.params.id);
        if(!user){
            return next(new ErrorHandler("Invalid User Id",404))
        }
        res.status(200).json({
            success:true,
            user
        })
    }
);

const deleteUser = TryCatch(
    async (req,res,next)=>{
        const user = await User.findByIdAndDelete(req.params.id);
        if(!user){
            return next(new ErrorHandler("Invalid User Id",404))
        }
        res.status(200).json({
            success:true,
            message:"User deleted successfully"
        })
    }
);

export { newUser  , getAllUser ,getUserById ,deleteUser};
