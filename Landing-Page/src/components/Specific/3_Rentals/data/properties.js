import { 
  rental1, 
  rental2, 
  rental3, 
  rental4, 
  rental5, 
  rental6,
  owner1,
  owner2,
  owner3,
  owner4,
  owner5,
  owner6, 
} from '../../../../assets/images';

const properties = [
  {
    id: 1,
    image: rental1,
    name: "3 Bedroom Apartment",
    location: "New York City",
    price: "$2,000,000",
    size: "2000 sqft",
    owner: "John Doe",
    ownerImage: owner1,
    parking: 2,
    bathrooms: 2,
    likes: Math.floor(Math.random() * 101),
  },
  {
    id: 2,
    image: rental2,
    name: "Cozy Studio",
    location: "San Francisco",
    price: "$800,000",
    size: "600 sqft",
    owner: "Jane Smith",
    ownerImage: owner2,
    parking: 1,
    bathrooms: 1,
    likes: Math.floor(Math.random() * 101),
  },
  {
    id: 3,
    image: rental3,
    name: "Luxury Villa",
    location: "Los Angeles",
    price: "$5,000,000",
    size: "5000 sqft",
    owner: "Robert Brown",
    ownerImage: owner3,
    parking: 4,
    bathrooms: 5,
    likes: Math.floor(Math.random() * 101),
  },
  {
    id: 4,
    image: rental4,
    name: "Modern Townhouse",
    location: "Seattle",
    price: "$1,200,000",
    size: "1500 sqft",
    owner: "Emily White",
    ownerImage: owner4,
    parking: 2,
    bathrooms: 3,
    likes: Math.floor(Math.random() * 101),
  },
  {
    id: 5,
    image: rental5,
    name: "Beachfront Cottage",
    location: "Miami",
    price: "$3,000,000",
    size: "2500 sqft",
    owner: "Chris Green",
    ownerImage: owner5,
    parking: 3,
    bathrooms: 3,
    likes: Math.floor(Math.random() * 101),
  },
  {
    id: 6,
    image: rental6,
    name: "Urban Loft",
    location: "Chicago",
    price: "$900,000",
    size: "1200 sqft",
    owner: "Laura Blue",
    ownerImage: owner6,
    parking: 1,
    bathrooms: 2,
    likes: Math.floor(Math.random() * 101),
  },
  {
    id: 7,
    image: rental1,
    name: "3 Bedroom Apartment",
    location: "New York City",
    price: "$2,000,000",
    size: "2000 sqft",
    owner: "John Doe",
    ownerImage: owner1,
    parking: 2,
    bathrooms: 2,
    likes: Math.floor(Math.random() * 101),
  },
  {
    id: 8,
    image: rental2,
    name: "Cozy Studio",
    location: "San Francisco",
    price: "$800,000",
    size: "600 sqft",
    owner: "Jane Smith",
    ownerImage: owner2,
    parking: 1,
    bathrooms: 1,
    likes: Math.floor(Math.random() * 101),
  },
  {
    id: 9,
    image: rental3,
    name: "Luxury Villa",
    location: "Los Angeles",
    price: "$5,000,000",
    size: "5000 sqft",
    owner: "Robert Brown",
    ownerImage: owner3,
    parking: 4,
    bathrooms: 5,
    likes: Math.floor(Math.random() * 101),
  },
  {
    id: 10,
    image: rental4,
    name: "Modern Townhouse",
    location: "Seattle",
    price: "$1,200,000",
    size: "1500 sqft",
    owner: "Emily White",
    ownerImage: owner4,
    parking: 2,
    bathrooms: 3,
    likes: Math.floor(Math.random() * 101),
  },
  {
    id: 11,
    image: rental5,
    name: "Beachfront Cottage",
    location: "Miami",
    price: "$3,000,000",
    size: "2500 sqft",
    owner: "Chris Green",
    ownerImage: owner5,
    parking: 3,
    bathrooms: 3,
    likes: Math.floor(Math.random() * 101),
  },
  {
    id: 12,
    image: rental6,
    name: "Urban Loft",
    location: "Chicago",
    price: "$900,000",
    size: "1200 sqft",
    owner: "Laura Blue",
    ownerImage: owner6,
    parking: 1,
    bathrooms: 2,
    likes: Math.floor(Math.random() * 101),
  },
];

export default properties;
