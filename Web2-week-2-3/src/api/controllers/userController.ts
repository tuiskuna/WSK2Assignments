import {NextFunction, Request, Response} from 'express';
import {User, UserOutput} from '../../types/DBTypes';
import userModel from '../models/userModel';
import CustomError from '../../classes/CustomError';
import bcrypt from 'bcrypt';
import {MessageResponse} from '../../types/MessageTypes';
import jwt from 'jsonwebtoken';

// - userGet - get user by id
const userGet = async (
  req: Request<{id: string}>,
  res: Response<UserOutput>,
  next: NextFunction
) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .select('-password -role');
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};
// - userListGet - get all users
const userListGet = async (
  req: Request,
  res: Response<UserOutput[]>,
  next: NextFunction
) => {
  try {
    const users = await userModel.find().select('-password -role');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// - userPost - create new user. Remember to hash password
const userPost = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    const salt = bcrypt.genSaltSync(12);

    const userInput = {
      user_name: req.body.user_name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, salt),
      role: 'user',
    };

    const user = await userModel.create(userInput);
    res.status(200).json({
      message: 'User added',
      data: {
        _id: user._id,
        user_name: user.user_name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

/* // - userPut - update user by id
const userPut = async (
  req: Request<{}, {}, User>,
  res: Response<UserOutput>,
  next: NextFunction
) => {
  try {
    console.log('user put controller body', req.body);
    const id = req.body._id;
    const user = await userModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    console.log('user put controller user', user);
    const {password, role, ...userNoPassOrRole} = user.toObject();
    res.json(userNoPassOrRole);
  } catch (error) {
    next(error);
  }
};
 */

// - userPutCurrent - update current user based on token
const userPutCurrent = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    const updatedUser = await userModel
      .findByIdAndUpdate(res.locals.user._id, req.body, {
        new: true,
      })
      .select('-password -role');
    if (!updatedUser) {
      throw new CustomError('User not found', 404);
    }
    res.status(200).json({
      message: 'User added',
      data: {
        _id: updatedUser._id,
        user_name: updatedUser.user_name,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

/* // - userDelete - delete user by id
const userDelete = async (
  req: Request<{id: string}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await userModel.findByIdAndDelete(req.params.id);
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    res.json({message: 'User deleted'});
  } catch (error) {
    next(error);
  }
}; */

// - userDeleteCurrent - delete current user based on token
const userDeleteCurrent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await userModel
      .findById(res.locals.user._id)
      .select('-password -role');
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    await userModel.findByIdAndDelete(user._id);
    res.status(200).json({
      message: 'User deleted',
      data: {
        _id: user._id,
        user_name: user.user_name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const checkToken = async (
  req: Request,
  res: Response<UserOutput>,
  next: NextFunction
) => {
  try {
    if (!res.locals.user || !('_id' in res.locals.user)) {
      throw new CustomError('No user', 400);
    }
    const {password, role, ...userWithoutPassOrRole} = res.locals.user;
    res.json(userWithoutPassOrRole);
  } catch (error) {
    next(error);
  }
};

export {
  userGet,
  userListGet,
  userPost,
  userPutCurrent,
  userDeleteCurrent,
  checkToken,
};
