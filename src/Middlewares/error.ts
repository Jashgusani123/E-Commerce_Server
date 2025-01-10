import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../Utils/Utility-Class.js";

type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

export const errorHandler = (
  error: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  error.message ||= "Internal Server Error";
  error.statusCode ||= 500;

  if(error.name === "CastError"){
    error.message = `Invalid ID`;
    error.statusCode = 400;
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
  });
};

export const TryCatch = (func: ControllerType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
