# Landing Page Documentation

## Overview

This landing page is built using **React.js** with **Vite**. It also incorporates **HTML5**, **vanilla CSS**, **Tailwind CSS**, and **PostCSS**.

### Core External Libraries

- **Fortawesome**
- **Lodash**
- **React Scroll**
- **Swiper**
- **MUI (Material-UI)**
- **Ant Design (antd)**

### Structure

The landing page consists of the following sections:

1. **Hero**: Includes the header, main heading, and a search bar.
2. **Property**: Showcases properties based on location.
3. **Rentals**: Provides details about rentals and Airbnbs.
4. **Services**: Outlines additional services offered.
5. **About**: Contains information about the platform.

### Pages

1. **Root Page** (Route: `/`): Houses all the sections.
2. **Details Display Page** (Dynamic Route: `/:type/:name/*`): Displays detailed information based on the selected item.

### Features

- **Theme Control**: Theme is attached to the HTML `<body>` tag.
- **Image Handling**: All images are imported via the `images/assets` directory.

## Functionality

### Component Rendering

- Sections are displayed based on priority, managed by `context/PriorityDisplay.jsx`.
  - If a section’s ID is prioritized, it is displayed alone.
  - The **Hero** and **Footer** components always work independently.
  - If `priorityDisplay` state is set to `null`, all sections are displayed.

### Navigation

- **Forward Navigation**: Not allowed; navigation resets to the root (`/`).
- **Browser Refresh**: Resets to the root (`/`).
- **Backward Navigation**: Also resets to the root (`/`).

### Data Mapping

#### Header

- Navigation items are mapped to `<Link>` tags.
- The `onClick` behavior is based on the lowercase value of `Array[nav items]`, matching the section's ID.

#### Property

- Properties are displayed with an independent `Options` component using provided props.
- Example property object:
  ```javascript
  {
    id: 1,
    image: 'Nairobi',
    name: 'Nairobi',
    listings: getRandomListings(),
  }
  ```

#### SearchResults

- Shared by multiple components (`Components/Common/Search/`).
- Example object:
  ```javascript
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
  }
  ```
- **Mandatory Keys**:
  - `image` (property images)
  - `name` (name of the property)
  - `location`
  - `price`
  - `owner` (owner name)
  - `ownerImage` (owner profile picture)
  - `likes`
- **Optional Keys**:
  - Additional keys are optional but may require updates to the `SearchResult` component if the structure changes.

#### Rentals

- Displays rentals and Airbnbs using the `SearchResults` component.

#### About

- A simple layout with mapped data.

### Authentication

- Navigation items depend on the `isLoggedIn` context.
- Refer to `Common/Profile.jsx` for handling login and signup functionality.

### Data Flow

- Navigation and state handling use `useNavigate`, `useLocation`, and `params` hooks.
- Example Workflow:
  1. The **Property** component passes the location to the `SearchResults` component to fetch relevant data.
  2. Clicking on a specific property passes details to the `DisplayDetails` component.
  3. Component rendering depends on `location.state` and the specified action (grid, details, service).
