import {body} from 'express-validator';
// TODO: create following functions:

import {NextFunction, Request, Response} from 'express';
import catModel from '../models/catModel';
import {Cat, User} from '../../types/DBTypes';
import CustomError from '../../classes/CustomError';
import {MessageResponse} from '../../types/MessageTypes';
import {verify} from 'jsonwebtoken';

// - catListGet - get all cats OK
const catListGet = async (
  req: Request,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const cats = await catModel.find();
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

// - catGet - get cat by id
const catGet = async (
  req: Request<{id: string}>,
  res: Response<Cat>,
  next: NextFunction
) => {
  try {
    console.log('get cat', req.params.id);
    const cat = await catModel.findById(req.params.id);
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json(cat);
  } catch (error) {
    next(error);
  }
};

// - catPost - create new cat
const catPost = async (
  req: Request<{}, {}, Cat>,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('catPost', req.body);
    const catInput = {
      cat_name: req.body.cat_name,
      weight: req.body.weight,
      filename: req.body.filename,
      birthdate: req.body.birthdate,
      location: req.body.location,
      owner: res.locals._id,
    };
    console.log(
      'res.locals._id, locaton, filename',
      res.locals._id,
      req.body.location,
      req.body.filename
    );
    console.log('catInput', catInput);
    const cat = await catModel.create(catInput);
    if (!cat) {
      throw new CustomError('Cat not created', 400);
    }
    res.json({
      message: 'Cat added',
      data: {
        _id: cat._id,
        cat_name: cat.cat_name,
        weight: cat.weight,
        filename: cat.filename,
        birthdate: cat.birthdate,
        location: cat.location,
        owner: cat.owner.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// - catGetByUser - get all cats by current user id
const catGetByUser = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decodedUser = verify(token as string, 'asdf') as User;
    const cats = await catModel.find({owner: decodedUser._id});
    res.json(cats);
  } catch (error) {
    next(new CustomError('Error while getting cats', 500));
  }
};

// - catPutAdmin - only admin can change cat owner
const catPutAdmin = async (
  req: Request<{id: string}, {}, Cat>,
  res: Response,
  next: NextFunction
) => {
  try {
    const reqUser = req.user as User;
    if (reqUser.role === 'admin') {
      const cat = await catModel.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      if (!cat) {
        throw new CustomError('No cat found', 404);
      }
      res.json({
        message: 'Cat updated',
        data: cat,
      });
    } else {
      throw new CustomError('User is not admin', 403);
    }
  } catch (error) {
    next(error);
  }
};

// - catDeleteAdmin - only admin can delete cat
const catDeleteAdmin = async (
  req: Request<{id: string}, {}, {}>,
  res: Response<Cat>,
  next: NextFunction
) => {
  try {
    const reqUser = req.user as User;
    if (reqUser.role === 'admin') {
      const cat = (await catModel.findByIdAndDelete(
        req.params.id
      )) as unknown as Cat;
      if (!cat) {
        throw new CustomError('No cat found', 404);
      }
      res.json(cat);
    } else {
      throw new CustomError('User is not admin', 403);
    }
  } catch (error) {
    next(error);
  }
};

// - catDelete - only owner can delete cat
const catDelete = async (
  req: Request<{id: string}, {}, {user: User}>,
  res: Response<Cat>,
  next: NextFunction
) => {
  try {
    const cat = await catModel.findById(req.params.id);
    if (req.body.user._id !== cat?.owner) {
      const cat = (await catModel.findByIdAndDelete(
        req.params.id
      )) as unknown as Cat;
      if (!cat) {
        throw new CustomError('No cat found', 404);
      }
      res.json(cat);
    } else {
      throw new CustomError('User is not owner', 403);
    }
  } catch (error) {
    next(error);
  }
};

// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
const catGetByBoundingBox = async (
  req: Request<{}, {}, {}, {topRight: string; bottomLeft: string}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const topRight = req.query.topRight.split(',');
    const bottomLeft = req.query.bottomLeft.split(',');
    const cats = await catModel.find({
      location: {
        $geoWithin: {
          $box: [
            [Number(bottomLeft[0]), Number(bottomLeft[1])],
            [Number(topRight[0]), Number(topRight[1])],
          ],
        },
      },
    });
    res.json(cats);
  } catch (error) {
    next(new CustomError('Error while getting cats', 500));
  }
};
// - catPut - only owner can update cat
const catPut = async (
  req: Request<{}, {}, Cat>,
  res: Response<Cat>,
  next: NextFunction
) => {
  try {
    console.log('catPut', req.body);
    const cat = await catModel.findById(req.body.id);
    if (!cat) {
      throw new CustomError('No cat found', 404);
    }
    if (res.locals._id !== cat.owner.id) {
      throw new CustomError('User is not owner', 403);
    }
    const catInput = {
      cat_name: req.body.cat_name,
      weight: req.body.weight,
      filename: req.body.filename,
      birthdate: req.body.birthdate,
      location: req.body.location,
      owner: res.locals._id,
    };
    console.log('catInput', catInput);
    const updatedCat = await catModel.findByIdAndUpdate(cat._id, catInput);
    if (!updatedCat) {
      throw new CustomError('No cat found', 404);
    }
    console.log('updatedCat', updatedCat);
    res.json(updatedCat);
  } catch (error) {
    next(error);
  }
};

export {
  catListGet,
  catGet,
  catPost,
  catGetByUser,
  catPutAdmin,
  catDeleteAdmin,
  catDelete,
  catGetByBoundingBox,
  catPut,
};
