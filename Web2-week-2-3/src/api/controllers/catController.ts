import {NextFunction, Request, Response} from 'express';
import {Cat} from '../../types/DBTypes';
import CatModel from '../models/catModel';
import CustomError from '../../classes/CustomError';
import {MessageResponse} from '../../types/MessageTypes';
// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
const catListGet = async (
  _req: Request,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const cats = await CatModel.find().select('-__v').populate({
      path: 'owner',
      select: '-__v -password -role',
    });
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

const catGet = async (
  req: Request<{id: string}>,
  res: Response<Cat>,
  next: NextFunction
) => {
  try {
    const cats = await CatModel.findById(req.params.id)
      .select('-__v')
      .populate({
        path: 'owner',
        select: '-__v -password -role',
      });
    if (!cats) {
      throw new CustomError('Cat not found', 404);
    }
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

const catGetByUser = async (
  req: Request,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    if (!res.locals.user || !('_id' in res.locals.user)) {
      throw new CustomError('Invalid user data', 400);
    }
    const cats = await CatModel.find({owner: res.locals.user._id});
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

/**
 *
Create a postCat function that sends a POST request to /api/v1/cats/ with the following parameters:
- token: string - user token
- pic: string - path to the cat picture file
The function should return a Promise that resolves to a MessageResponse & {data: Cat} object.
 */
const catPost = async (
  req: Request<{token: string; pic: string}, {}, Omit<Cat, '_id'>>,
  res: Response<MessageResponse & {data: Cat}>,
  next: NextFunction
) => {
  req.body.filename = req.file?.path || '';
  try {
    if (!res.locals.user || !('_id' in res.locals.user)) {
      throw new CustomError('Invalid user data', 400);
    }

    req.body.location = {
      ...req.body.location,
      type: 'Point',
    };
    console.log('location', req.body.location.coordinates);

    const cat = await CatModel.create({
      ...req.body,
      owner: res.locals.user._id,
    });
    const response: MessageResponse & {data: Cat} = {
      message: 'OK',
      data: cat,
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
const catPut = async (
  req: Request<{id: string}, {}, Omit<Cat, '_id'>>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    req.body.location = {
      ...req.body.location,
      type: 'Point',
    };
    const cat = await CatModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!res.locals.user || !('_id' in res.locals.user)) {
      throw new CustomError('Invalid user data', 400);
    }
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    const response: MessageResponse & {data: Cat} = {
      message: 'OK',
      data: cat,
    };
    console.log('response', response);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const catPutAdmin = async (
  req: Request<{id: string}, {}, Omit<Cat, '_id'>>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    // Check if the user is an admin
    if (!res.locals.user || res.locals.user.role !== 'admin') {
      throw new CustomError('Permission denied.', 403);
    }

    req.body.location = {
      ...req.body.location,
      type: 'Point',
    };
    const cat = await CatModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }

    const response: MessageResponse & {data: Cat} = {
      message: 'OK',
      data: cat,
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const catDelete = async (
  req: Request<{id: string}>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    if (!res.locals.user || !('_id' in res.locals.user)) {
      throw new CustomError('Permission denied.', 403);
    }
    const cat = await CatModel.findByIdAndDelete(req.params.id);

    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }

    const response: MessageResponse & {data: Cat} = {
      message: 'Cat deleted',
      data: cat as unknown as Cat,
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const catDeleteAdmin = async (
  req: Request<{id: string}>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    // Check if the user is an admin
    if (!res.locals.user || res.locals.user.role !== 'admin') {
      throw new CustomError('Permission denied.', 403);
    }
    const cat = await CatModel.findByIdAndDelete(req.params.id);
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    const response: MessageResponse & {data: Cat} = {
      message: 'Cat deleted',
      data: cat as unknown as Cat,
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
//catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
const catGetByBoundingBox = async (
  req: Request<{}, {}, {}, {topRight: string; bottomLeft: string}>,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const {topRight, bottomLeft} = req.query;
    // query example: /cats/area?topRight=40.73061,-73.935242&bottomLeft=40.71427,-74.00597
    // longitude first, then latitude (opposite of google maps)

    const rightCorner = topRight.split(',');
    const leftCorner = bottomLeft.split(',');
    console.log('top right bottom left', rightCorner, leftCorner);
    console.log('coords:');
    const cats = await CatModel.find({
      location: {
        $geoWithin: {
          $box: [leftCorner, rightCorner],
        },
      },
    })
      .select('-__v')
      .populate('category', '-__v');
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

export {
  catDelete,
  catDeleteAdmin,
  catGet,
  catGetByBoundingBox,
  catGetByUser,
  catListGet,
  catPost,
  catPut,
  catPutAdmin,
};
