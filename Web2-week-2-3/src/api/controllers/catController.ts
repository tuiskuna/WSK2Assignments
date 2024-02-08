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
// - catPost - create new cat
const catPost = async (
  req: Request<{}, {}, Cat>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  const user = res.locals.user;
  const cat: Omit<Cat, '_id'> = {
    cat_name: req.body.cat_name,
    weight: req.body.weight,
    filename: req.file?.filename as string,
    birthdate: req.body.birthdate,
    location: res.locals.coords,
    owner: {
      _id: user._id!,
      user_name: user.user_name!,
      email: user.email!,
      role: 'user',
      password: '',
    },
  };

  try {
    const result = await CatModel.create(cat);
    const response: MessageResponse & {data: Cat} = {
      message: 'OK',
      data: result,
    };
    console.log('response', response);
    res.status(200).json(response);
  } catch (e) {
    next(e);
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
// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
const catGetByBoundingBox = async (
  req: Request,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const getCoordinate = (coordinateString: string, index: number): number => {
      return parseFloat(coordinateString.split(',')[index]);
    };
    const topRightMax = getCoordinate(req.query.topRight as string, 0);
    const topRightMin = getCoordinate(req.query.topRight as string, 1);
    const bottomLeftMax = getCoordinate(req.query.bottomLeft as string, 0);
    const bottomLeftMin = getCoordinate(req.query.bottomLeft as string, 1);
    const cats = await CatModel.find({});
    const _cats: Cat[] = cats.filter((cat: Cat) => {
      const [lat, lon] = cat.location.coordinates;
      return (
        lat <= topRightMax &&
        lat >= topRightMin &&
        lon <= bottomLeftMax &&
        lon >= bottomLeftMin
      );
    });
    res.json(_cats);
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
