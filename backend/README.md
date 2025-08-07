# LinkNamali Backend

## Overview

A Flask-based backend for property listings, bookings, and ads management.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/merime-space/LinknaMali.git
   cd linknamali-backend
   python -m venv venv
   source venv/bin/activate  # On macOS/Linux
   venv\Scripts\activate   # On Windows
   pip install -r requirements.txt
   python linknamali.py  # Run the Flask app
   ```

## Imported Modules

- `from flask import Flask, request, jsonify`
- `from flask.views import MethodView`
- `from flask_restful import Api, Resource`
- `from flask_cors import CORS, cross_origin`
- `from werkzeug.utils import secure_filename`
- `from waitress import serve`
- `from functools import wraps`
- `from decimal import Decimal`
- `from flask_cors import CORS, cross_origin`
- `from utils.functions import *`
- `from datetime import datetime, timedelta, timezone, date`
- `from database.database import db_connection`
- `from apscheduler.schedulers.background import BackgroundScheduler`
- `from utils.cleanup import cleanup_soft_deleted_properties  # Import the cleanup function`
- `from routes.supportticket import supportticket`
- `from routes.ownerbookings import ownerbookings`
- `from routes.userlistings import userlistings`
- `from routes.enquiries import enquiries`
- `from routes.userprofile import userprofile`
- `from routes.adsmgt import adsmgt`
- `from routes.admineditrequest import editrequests`
- `import smtplib`
- `import random`
- `import re`
- `import logging`
- `import jwt`
- `import uuid`
- `import hashlib`
- `import os`
- `import json`
- `import requests`
- `from auth import auth`
- `from blogs import blogs`
- `from support import support`
- `from listing import listings`
- `from bookings import bookings`
- `from property import property`
- `from search_engine import search_engine`

## Registered Blueprints

- `auth` from `auth`
- `blogs` from `blogs`
- `support` from `routes.supportticket`
- `listings` from `listing`
- `bookings` from `bookings`
- `property` from `property`
- `search_engine` from `search_engine`
- `supportticket` from `routes.supportticket`
- `editrequests` from `routes.admineditrequest`
- `ownerbookings` from `routes.ownerbookings`
- `userlistings` from `routes.userlistings`
- `enquiries` from `routes.enquiries`
- `userprofile` from `routes.userprofile`
- `adsmgt` from `routes.adsmgt`

## Available Routes

| Method | Endpoint | Description |
| ------ | -------- | ----------- |

### General Flask Routes

| Method | Endpoint                                              | Description    |
| ------ | ----------------------------------------------------- | -------------- |
| GET    | `/test`                                               | No description |
| GET    | `/`                                                   | No description |
| GET    | `/new-listings`                                       | No description |
| POST   | `/reject_apartment/<string:id>`                       | No description |
| GET    | `/users`                                              | No description |
| POST   | `/user_register`                                      | No description |
| POST   | `/verify_otp`                                         | No description |
| POST   | `/user_login`                                         | No description |
| DELETE | `/deleteuser`                                         | No description |
| POST   | `/admin/login`                                        | No description |
| POST   | `/admin/register`                                     | No description |
| POST   | `/admin/logout`                                       | No description |
| GET    | `/protected`                                          | No description |
| POST   | `/addapartment`                                       | No description |
| GET    | `/getapartment`                                       | No description |
| PUT    | `/updateapartment/<string:id>`                        | No description |
| DELETE | `/deleteapartment`                                    | No description |
| POST   | `/addhouse`                                           | No description |
| GET    | `/gethouse`                                           | No description |
| PUT    | `/updatehouse/<string:id>`                            | No description |
| DELETE | `/deletehouse`                                        | No description |
| POST   | `/addland`                                            | No description |
| GET    | `/getland`                                            | No description |
| PUT    | `/updateland/<string:id>`                             | No description |
| DELETE | `/deleteland`                                         | No description |
| POST   | `/addcommercial`                                      | No description |
| GET    | `/getcommercial`                                      | No description |
| PUT    | `/updatecommercial/<string:id>`                       | No description |
| DELETE | `/deletecommercial`                                   | No description |
| GET    | `/search-listings`                                    | No description |
| POST   | `/addservice`                                         | No description |
| GET    | `/searchservice`                                      | No description |
| GET    | `/api/reports-analytics`                              | No description |
| POST   | `/logout`                                             | No description |
| GET    | `/propertylocationfilter`                             | No description |
| GET    | `/propertypurposefilter`                              | No description |
| GET    | `/gettoken`                                           | No description |
| PUT    | `/softdeleteproperty`                                 | No description |
| PUT    | `/adminmanageproperty`                                | No description |
| PUT    | `/adminapproveproperty`                               | No description |
| GET    | `/approvedproperties/<string:property_type>`          | No description |
| GET    | `/allproperties`                                      | No description |
| POST   | `/approve_apartment`                                  | No description |
| POST   | `/approve-house`                                      | No description |
| DELETE | `/admin/delete-property/<string:property_id>`         | No description |
| DELETE | `/delete/<string:property_type>/<string:property_id>` | No description |

### `auth` Blueprint Routes

| Method | Endpoint                                | Description    |
| ------ | --------------------------------------- | -------------- |
| GET    | `/auth/`                                | No description |
| GET    | `/auth/google`                          | No description |
| GET    | `/auth/google/callback`                 | No description |
| POST   | `/auth/googleusernotfound`              | No description |
| POST   | `/auth/is-new-user`                     | No description |
| POST   | `/auth/signup`                          | No description |
| POST   | `/auth/verify-otp`                      | No description |
| GET    | `/auth/cookie`                          | No description |
| POST   | `/auth/login`                           | No description |
| POST   | `/auth/logout`                          | No description |
| PUT    | `/auth/updateuser/<string:user_id>`     | No description |
| PUT    | `/auth/updatepassword/<string:user_id>` | No description |
| POST   | `/auth/send-password-reset`             | No description |
| POST   | `/auth/password-reset`                  | No description |
| PUT    | `/auth/deleteuser/<string:user_id>`     | No description |
| POST   | `/auth/profile-pic/upload`              | No description |
| DELETE | `/auth/profile-pic/delete`              | No description |

### `blogs` Blueprint Routes

| Method | Endpoint                            | Description    |
| ------ | ----------------------------------- | -------------- |
| GET    | `/blogs/`                           | No description |
| POST   | `/blogs/createblog`                 | No description |
| GET    | `/blogs/get-all-blogs`              | No description |
| GET    | `/blogs/get-blog/<string:blog_id>`  | No description |
| GET    | `/blogs/get-all/class-0`            | No description |
| GET    | `/blogs/get-all/class-1`            | No description |
| POST   | `/blogs/publish/<string:blog_id>`   | No description |
| POST   | `/blogs/unpublish/<string:blog_id>` | No description |
| DELETE | `/blogs/delete/<string:blog_id>`    | No description |

### `support` Blueprint Routes

| Method | Endpoint            | Description    |
| ------ | ------------------- | -------------- |
| GET    | `/support/`         | No description |
| POST   | `/support/feedback` | No description |

### `listings` Blueprint Routes

| Method | Endpoint                                                                               | Description    |
| ------ | -------------------------------------------------------------------------------------- | -------------- |
| GET    | `/listings/`                                                                           | No description |
| POST   | `/listings/createlisting`                                                              | No description |
| POST   | `/listings/createhouses`                                                               | No description |
| DELETE | `/listings/softdeletelisting/<string:property_type>/<string:property_id>`              | No description |
| DELETE | `/listings/deletelisting/<string:property_type>/<string:user_id>/<string:property_id>` | No description |
| PUT    | `/listings/unarchive/<string:property_type>/<string:property_id>`                      | No description |

### `bookings` Blueprint Routes

| Method | Endpoint                                        | Description    |
| ------ | ----------------------------------------------- | -------------- |
| GET    | `/bookings/`                                    | No description |
| POST   | `/bookings/createbookings`                      | No description |
| GET    | `/bookings/getbookings`                         | No description |
| GET    | `/bookings/getbookingbyid/<string:booking_id>`  | No description |
| PUT    | `/bookings/updatebookings/<string:booking_id>`  | No description |
| PUT    | `/bookings/bookings/<string:booking_id>/cancel` | No description |
| POST   | `/bookings/submitenquiry`                       | No description |
| DELETE | `/bookings/deletebooking/<string:booking_id>`   | No description |

### `property` Blueprint Routes

| Method | Endpoint                                                                             | Description    |
| ------ | ------------------------------------------------------------------------------------ | -------------- |
| GET    | `/property/`                                                                         | No description |
| GET    | `/property/getlocations`                                                             | No description |
| GET    | `/property/getpropertybylocation/<string:location>`                                  | No description |
| GET    | `/property/getapartments`                                                            | No description |
| GET    | `/property/getaccomodation`                                                          | No description |
| GET    | `/property/getpropertybyuserid`                                                      | No description |
| GET    | `/property/getallunapprovedproperty`                                                 | No description |
| GET    | `/property/get-all-approved-properties`                                              | No description |
| GET    | `/property/getpropertybyid/<string:property_type>/<string:id>`                       | No description |
| GET    | `/property/getuserlikestatus/<string:property_id>/<string:user_id>`                  | No description |
| POST   | `/property/toggle_like/<string:property_id>/<string:user_id>/<string:property_type>` | No description |
| GET    | `/property/under-review`                                                             | No description |
| GET    | `/property/notunderreview`                                                           | No description |

### `search_engine` Blueprint Routes

| Method | Endpoint         | Description    |
| ------ | ---------------- | -------------- |
| GET    | `/engine/`       | No description |
| GET    | `/engine/search` | No description |

### `support_ticket` Blueprint Routes

| Method | Endpoint                                  | Description                                                                         |
| ------ | ----------------------------------------- | ----------------------------------------------------------------------------------- |
| POST   | `/supportticket`                          | Handles support ticket creation and related database operations.                    |
| PUT    | `/tickets/<string:ticket_id>`             | No description                                                                      |
| GET    | `/support/tickets`                        | No description                                                                      |
| POST   | `/sendadminresponse`                      | API Resource to send an admin response, update ticket status, and log conversation. |
| POST   | `/userrespondticket`                      | No description                                                                      |
| DELETE | `/tickets/<string:ticket_id>/delete`      | No description                                                                      |
| GET    | `/ticketconversations/<string:ticket_id>` | API Resource to fetch all messages related to a support ticket.                     |
| GET    | `/getusertickets/<string:user_id>`        | No description                                                                      |
| GET    | `/userlistings/<string:user_id>`          | No description                                                                      |
| GET    | `/userads/<string:user_id>`               | No description                                                                      |

### `edit_requests` Blueprint Routes

| Method | Endpoint                                  | Description    |
| ------ | ----------------------------------------- | -------------- |
| POST   | `/editrequests`                           | No description |
| POST   | `/userconfirmedits`                       | No description |
| POST   | `/approveedits`                           | No description |
| GET    | `/edit_conversations`                     | No description |
| DELETE | `/conversations/<string:conversation_id>` | No description |

### `ownerbookings` Blueprint Routes

| Method | Endpoint                        | Description    |
| ------ | ------------------------------- | -------------- |
| GET    | `/`                             | No description |
| POST   | `/bookings`                     | No description |
| GET    | `/allbookings/<string:user_id>` | No description |
| PUT    | `/updatebookings`               | No description |
| GET    | `/bookings/check`               | No description |

### `userlistings` Blueprint Routes

| Method | Endpoint                                   | Description    |
| ------ | ------------------------------------------ | -------------- |
| POST   | `/apartmentlisting`                        | No description |
| PUT    | `/apartmentupdate/<string:apartment_id>`   | No description |
| POST   | `/houselisting`                            | No description |
| PUT    | `/houseupdate/<string:house_id>`           | No description |
| POST   | `/landlisting`                             | No description |
| PUT    | `/landupdate/<string:land_id>`             | No description |
| POST   | `/commerciallisting`                       | No description |
| PUT    | `/commercialupdate/<string:commercial_id>` | No description |

### `enquiries` Blueprint Routes

| Method | Endpoint                         | Description    |
| ------ | -------------------------------- | -------------- |
| GET    | `/`                              | No description |
| POST   | `/replyenquiry`                  | No description |
| POST   | `/enquiries`                     | No description |
| GET    | `/getenquiries/<string:user_id>` | No description |
| GET    | `/inquiries/check`               | No description |

### `userprofile` Blueprint Routes

| Method | Endpoint                           | Description    |
| ------ | ---------------------------------- | -------------- |
| POST   | `/userprofile`                     | No description |
| GET    | `/getuserprofile/<string:user_id>` | No description |

### `adsmgt` Blueprint Routes

| Method | Endpoint              | Description    |
| ------ | --------------------- | -------------- |
| POST   | `/ads`                | No description |
| POST   | `/mpesa-payment`      | No description |
| GET    | `/user-ads/<user_id>` | No description |

## Available Functions

No documented functions found.
