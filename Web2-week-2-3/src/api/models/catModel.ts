import mongoose from 'mongoose';
import {Cat} from '../../types/DBTypes';

const catSchema = new mongoose.Schema<Cat>({
  cat_name: {
    type: String,
    required: true,
    minlength: 2,
  },
  weight: {
    type: Number,
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  filename: {
    //imagepath
    type: String,
  },
  birthdate: {
    type: Date,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
});

const CatModel = mongoose.model<Cat>('Cat', catSchema);
export default CatModel;
