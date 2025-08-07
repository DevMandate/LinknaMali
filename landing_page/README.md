# Documentation

## Table of Content
* [Environment](#environment)
* [Installation](#installation)
* [Website Structure](#website-structure)
* [Important Notes](#important-notes)
* [Bugs](#bugs)
* [Authors](#authors)
* [License](#license)


## Environment
This project was built on Ubuntu 22.04.5 LTS. The website was built using **React.js** with **Vite**. It also incorporates **HTML5**, **vanilla CSS**, **Tailwind CSS**, and **PostCSS**.

- Refer to [`package.json`](package.json) for external libraries.
- Refer to [`vite.config.js`](vite.config.js) for proxy configurations.

## Installation
* Clone this repository: `git clone https://github.com/merime-space/LinknaMali.git`
* Access Landing page directory: `cd LinknaMali/landing_page`
* Install dependancies: `npm install`
* Run the website: `npm run dev`

## Website Structure

The website consists of three main sections:

1. **Landing Page**
2. **General User Portal** – A portal where users can search, book properties, and manage inquiries.
3. **Landing Page Control Portal** – An admin system for blog management and content moderation.

All three sections include:

- **Header** – Includes the header, main heading, and search bar.  
  → [`Header Folder`](src/components/Layout/Header/)
- **Property** – Displays properties based on location.
- **Featured Rentals** – Highlights rental properties and Airbnbs.
- **Service Providers Market** – Lists additional services offered.

---

### Landing Page

Unique sections include:

1. **Hero** – Features the header, main heading, and search bar.
2. **About** – Contains platform information.
3. **Blogs** – Displays blog content (e.g. *Story za Mitaa* and property tips).

---

### General User Portal

Built on top of the Landing Page. It includes the following additional sections:

1. **Bookings Management** – Creation, deletion, and overall management of bookings.  
   → [`Bookings Folder`](src/components/Specific/DetailsDisplay/Bookings/)
2. **Inquiries** – Allows users to make inquiries.  
   → [`Enquiries File`](src/components/Specific/DetailsDisplay/Enquiries.jsx)
3. **Settings** – User preferences and account configuration.  
   → [`Settings Folder`](src/components/Specific/settings/)

---

### Landing Page Control Portal

Built on top of the General User Portal.  
→ [`Admin Folder`](src/components/Admin/)

Additional sections include:

1. **Blog Management** – Handles blog content creation and editing.
2. **Policy Center** – Manages property-related policies.
3. **Landing Page Editor** – Enables customization of landing page content.


Here's a refined and more structured version of your **Important Notes** section. It maintains your original meaning while improving grammar, indentation, and clarity:

---

## Important Notes

### Context Management

There are **four context files**, each tightly integrated into the system. These context states are critical, especially those in:

- [`SearchEngine.jsx`](src/context/SearchEngine.jsx)
- [`IsLoggedIn.jsx`](src/context/IsLoggedIn.jsx)


> ⚠️ If **any** state within these files is modified or tampered with, **the entire system must be tested** — this includes:
- **Signup**
- **Login**
- **Verification**
- **Password Reset**
- **Updating personal details** in settings  
  → This step requires **email verification**  
  → [`Settings Email Verification`](src/components/Specific/settings/children/PersonalInfo.jsx)

---

### Component Rendering

- Section rendering is prioritized using [`PriorityDisplay.jsx`](src/context/PriorityDisplay.jsx).
  - If a section ID is prioritized, **only that section** will be displayed.
  - The **Header** component is rendered **independently** of section priorities.
  
**Example**:  
On the landing page, if the `priorityDisplay` state is set to `null`, **all sections** will be displayed.

## Bugs

1. **Verification Issue when logged in**

   The **Signup** component currently relies on `useNavigate` to determine if navigation is made to it externally. The issue arises when editing personal information in the **Settings** section, specifically when the email is changed. This triggers verification. 

   The Signup component reads the `location.state`. If `verify === true`, it displays the verification page. However, when this page is refreshed, the state is cleared, which may result in the Signup page being shown to a logged-in user, instead of the verification segment.

   **Solution**: To resolve this, the page should utilize **URLSearchParams** (or `urlparams`) to persist the verification page even after a refresh. By embedding the state directly in the URL, the verification page can be reliably displayed.


## Authors
1. Michael Machohi - [GitHub](https://github.com/sierra-95), [Email](mailto:michaelmachohi@gmail.com)


## License
Merime Development. All rights Reserved