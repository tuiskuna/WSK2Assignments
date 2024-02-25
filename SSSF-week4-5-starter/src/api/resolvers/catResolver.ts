import catModel from '../models/catModel';
import {Cat, LocationInput} from '../../types/DBTypes';
import {MyContext} from '../../types/MyContext';
import {isLoggedIn} from '../../functions/authorize';

// TODO: create resolvers based on cat.graphql
// note: when updating or deleting a cat, you need to check if the user is the owner of the cat
// note2: when updating or deleting a cat as admin, you need to check if the user is an admin by checking the role from the user object
// note3: updating and deleting resolvers should be the same for users and admins. Use if statements to check if the user is the owner or an admin

export default {
  Query: {
    cats: async () => {
      return await catModel.find();
    },
    catById: async (_parent: undefined, args: Cat) => {
      return await catModel.findById(args.id);
    },
    catsByArea: async (_parent: undefined, args: LocationInput) => {
      const rightCorner = [args.topRight.lng, args.topRight.lat];
      const leftCorner = [args.bottomLeft.lng, args.bottomLeft.lat];
      return await catModel.find({
        location: {
          $geoWithin: {
            $box: [leftCorner, rightCorner],
          },
        },
      });
    },
    catsByOwner: async (_parent: undefined, args: Cat) => {
      return await catModel.find({owner: args.owner});
    },
  },
  Mutation: {
    createCat: async (
      parent: undefined,
      args: {input: Omit<Cat, 'id'>},
      context: MyContext,
    ) => {
      isLoggedIn(context);
      args.input.owner = context.userdata?.user.id;
      return await catModel.create(args.input);
    },
    updateCat: async (
      parent: undefined,
      args: {id: String; input: Partial<Omit<Cat, 'id'>>},
      context: MyContext,
    ) => {
      isLoggedIn(context);
      if (context.userdata?.user.role === 'admin') {
        return await catModel.findByIdAndUpdate(args.id, args.input, {
          new: true,
        });
      }
      const cat = await catModel.findById(args.id);
      console.log('CAT ', cat?.owner.toString());
      console.log('USER ', context.userdata?.user.id);
      if (context.userdata?.user.id !== cat?.owner.toString()) {
        console.log('NOT AUTHORIZED');
        throw new Error('Not authorized');
      }
      return await catModel.findByIdAndUpdate(args.id, args.input, {
        new: true,
      });
    },
    deleteCat: async (
      parent: undefined,
      args: {id: String},
      context: MyContext,
    ) => {
      isLoggedIn(context);
      if (context.userdata?.user.role === 'admin') {
        return await catModel.findByIdAndDelete(args.id);
      }
      const filter = {_id: args.id, owner: context.userdata?.user.id};
      return await catModel.findOneAndDelete(filter);
    },
  },
};
