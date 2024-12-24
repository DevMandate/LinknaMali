import { 
  Nairobi,
  Kisumu, 
  Kiambu, 
  Mombasa, 
  Nakuru 
} from '../../../../../assets/images';

const getRandomListings = (min = 10, max = 50) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const properties = [
  {
    id: 1,
    image: Nairobi,
    name: "Nairobi",
    listings: getRandomListings(),
  },
  {
    id: 2,
    image: Kiambu,
    name: "Kiambu",
    listings: getRandomListings(),
  },
  {
    id: 3,
    image: Nakuru,
    name: "Nakuru",
    listings: getRandomListings(),
  },
  {
    id: 4,
    image: Mombasa,
    name: "Mombasa",
    listings: getRandomListings(),
  },
  {
    id: 5,
    image: Kisumu,
    name: "Kisumu",
    listings: getRandomListings(),
  },
  {
    id: 6,
    image: Nairobi,
    name: "Nairobi Suburbs",
    listings: getRandomListings(),
  },
  {
    id: 7,
    image: Kiambu,
    name: "Thika",
    listings: getRandomListings(),
  },
  {
    id: 8,
    image: Nakuru,
    name: "Naivasha",
    listings: getRandomListings(),
  },
  {
    id: 9,
    image: Mombasa,
    name: "Diani",
    listings: getRandomListings(),
  },
  {
    id: 10,
    image: Mombasa,
    name: "Kisumu West",
    listings: getRandomListings(),
  },
];

export default properties;
