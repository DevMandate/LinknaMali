from flask import Blueprint, request, jsonify
from flask_cors import CORS
from flask_argon2 import Argon2
from flask_restful import Api, Resource, reqparse
from models import Apartment, House, Land, Commercial, Location, User, Like
from models.engine.db_engine import SessionLocal, get_property_by_id
from sqlalchemy import or_
from datetime import datetime, timezone
import logging
import uuid

property = Blueprint('property', __name__, url_prefix='/property')
api = Api(property)
CORS(property, resources={
    r"/property/*": {
        "origins": [
            "http://localhost:5173",
            "http://localhost:5174", 
            "https://linknamali.ke",
            "https://portal.linknamali.ke"
        ],
        "supports_credentials": True
    },
})

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
argon2 = Argon2()

@property.route('/', methods=['GET'])
def welcome():
    return "Welcome to properties"

class GetLocations(Resource):
    def get(self):
        session = None
        try:
            session = SessionLocal()
            locations = session.query(Location).all()
            if not locations:
                return {"message": "No locations found."}, 404

            locations_data = [location.as_dict(session) for location in locations]

            return {
                "message": "Locations fetched successfully.",
                "data": locations_data
            }, 200

        except Exception as e:
            return {"message": "An error occurred", "error": str(e)}, 500

        finally:
            if session:
                session.close()



class GetPropertyByLocation(Resource):
    def get(self, location):
        session = None
        try:
            session = SessionLocal()
            apartments = Apartment.get_active(session).filter(Apartment.location == location).all()
            houses = House.get_active(session).filter(House.location == location).all()
            lands = Land.get_active(session).filter(Land.location == location).all()
            commercials = Commercial.get_active(session).filter(Commercial.location == location).all()

            properties = {
                "apartments": [property.as_dict(session) for property in apartments],
                "houses": [property.as_dict(session) for property in houses],
                "land": [property.as_dict(session) for property in lands],
                "commercial": [property.as_dict(session) for property in commercials],
            }

            if not any(properties.values()):
                return {"message": f"No properties found for location '{location}'."}, 404

            return {"message": "Properties fetched successfully.", "data": properties}, 200

        except Exception as e:
            return {"message": "An error occurred", "error": str(e)}, 500

        finally:
            if session:
                session.close()


class GetApartments(Resource):
    def get(self):
        session = None
        try:
            session = SessionLocal()
            apartments = Apartment.get_active(session).all()

            apartments_list = [apt.as_dict(session) for apt in apartments]

            if not apartments_list:
                return {"message": "No apartments found.", "data": []}, 404

            return {"message": "Apartments fetched successfully.", "data": apartments_list}, 200

        except Exception as e:
            return {"message": "An error occurred", "error": str(e)}, 500

        finally:
            if session:
                session.close()


class GetAccomodation(Resource):
    def get(self):
        session = None
        try:
            session = SessionLocal()
            apartments = Apartment.get_active(session)
            commercials = Commercial.get_active(session)
            houses = House.get_active(session)

            accommodations_list = []
            for properties in [apartments, commercials, houses]:
                accommodations_list.extend([property.as_dict(session) for property in properties])

            if not accommodations_list:
                return {"message": "No accommodations found.", "data": []}, 404

            return {"message": "Accommodations fetched successfully.", "data": accommodations_list}, 200

        except Exception as e:
            return {"message": "An error occurred", "error": str(e)}, 500

        finally:
            if session:
                session.close()


class GetPropertyById(Resource):
    def get(self, property_type, id):
        session = None
        try:
            session = SessionLocal()
            property_data = get_property_by_id(session, id, property_type)

            if property_data is None:
                return {"message": "Invalid property type."}, 400
            elif "is_deleted" in property_data:
                return {"message": "Property not found or deleted."}, 404

            return {"message": "Property fetched successfully.", "data": property_data}, 200

        except Exception as e:
            return {"message": "An error occurred", "error": str(e)}, 500

        finally:
            if session:
                session.close()


class GetPropertyByUserId(Resource):
    def get(self):
        session = None
        try:
            session = SessionLocal()
            user_id = request.args.get('user_id')
            
            if not user_id:
                return {'response': 'Missing user_id parameter'}, 400
            
            user = session.query(User).filter_by(user_id=user_id).first()
            if not user:
                return {'response': 'User not found'}, 404
            
            properties = (
                user.apartments +
                user.houses +
                user.lands +
                user.commercials
            )

            if not properties:
                return {'response': 'No properties found for this user'}, 404

            properties_list = [prop.as_dict(session) for prop in properties]
            return {'response': 'Success', 'data': properties_list}, 200

        except Exception as e:
            logging.error(f"Error fetching properties: {str(e)}")
            return {'response': 'Internal server error'}, 500
        
        finally:
            if session:
                session.close()


class GetAllUnapprovedProperty(Resource):
    def get(self):
        session = None
        try:
            session = SessionLocal()
            
            # Fetch unapproved properties
            apartments = Apartment.get_unapproved(session).all()
            houses = House.get_unapproved(session).all()
            land = Land.get_unapproved(session).all()
            commercial = Commercial.get_unapproved(session).all()
            
            # Convert properties to dictionaries
            unapproved_properties = []
            for property_set in [apartments, houses, land, commercial]:
                unapproved_properties.extend([prop.as_dict(session) for prop in property_set])
            
            if not unapproved_properties:
                return {'response': 'No unapproved properties found'}, 404
            
            return {'response': 'Success', 'data': unapproved_properties}, 200
        
        except Exception as e:
            logging.error(f"Error fetching unapproved properties: {str(e)}")
            return {'response': 'Internal server error'}, 500
        
        finally:
            if session:
                session.close()


class GetAllApprovedProperty(Resource):
    def get(self):
        session = None
        try:
            session = SessionLocal()
            
            # Fetch approved properties
            apartments = Apartment.get_active(session)
            houses = House.get_active(session)
            land = Land.get_active(session)
            commercial = Commercial.get_active(session)

            # Convert properties to dictionaries
            approved_properties = []
            for property_set in [apartments, houses, land, commercial]:
                approved_properties.extend([prop.as_dict(session) for prop in property_set])

            if not approved_properties:
                return {'response': 'No approved properties found'}, 404

            return {'response': 'Success', 'data': approved_properties}, 200

        except Exception as e:
            logging.error(f"Error fetching approved properties: {str(e)}")
            return {'response': 'Internal server error'}, 500

        finally:
            if session:
                session.close()


class GetUserLikeStatus(Resource):
    def get(self, property_id, user_id):
        session = None
        try:
            session = SessionLocal()

            # Check if the user has liked the property
            exists = session.query(Like).filter_by(user_id=user_id, property_id=property_id).first()
            
            return {"message": "Success", "liked": bool(exists)}, 200
        
        except Exception as e:
            return {"message": "An error occurred", "error": str(e)}, 500
        
        finally:
            if session:
                session.close()


class ToggleLike(Resource):
    def post(self, property_id, user_id, property_type):
        session = None
        try:
            session = SessionLocal()
            
            # Check if the user has already liked the property
            existing_like = session.query(Like).filter_by(user_id=user_id, property_id=property_id).first()

            if existing_like:
                # Unlike (Remove like)
                session.delete(existing_like)
                session.commit()
                return {"message": "Property unliked", "liked": False}, 200
            else:
                # Like (Add like)
                new_like = Like(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    property_id=property_id,
                    property_type=property_type
                )
                session.add(new_like)
                session.commit()
                return {"message": "Property liked", "liked": True}, 201

        except Exception as e:
            session.rollback()
            return {"message": "An error occurred", "error": str(e)}, 500
        
        finally:
            if session:
                session.close()



class GetPropertiesUnderReview(Resource):
    def get(self):
        session = None
        try:
            session = SessionLocal()
            apartments = Apartment.get_properties_by_review_status(session, 1).all()
            houses = House.get_properties_by_review_status(session, 1).all()
            land = Land.get_properties_by_review_status(session, 1).all()
            commercials = Commercial.get_properties_by_review_status(session, 1).all()

            under_review_properties = []
            for property_set in [apartments, houses, land, commercials]:
                under_review_properties.extend([prop.as_dict(session) for prop in property_set])

            if not under_review_properties:
                return {'response': 'No properties under review found'}, 404

            return {'response': 'Success', 'data': under_review_properties}, 200

        except Exception as e:
            logging.error(f"Error fetching properties under review: {str(e)}")
            return {'response': 'Internal server error'}, 500

        finally:
            if session:
                session.close()


class GetPropertiesNotUnderReview(Resource):
    def get(self):
        session = None
        try:
            session = SessionLocal()
            apartments = Apartment.get_properties_by_review_status(session, 0).all()
            houses = House.get_properties_by_review_status(session, 0).all()
            land = Land.get_properties_by_review_status(session, 0).all()
            commercials = Commercial.get_properties_by_review_status(session, 0).all()

            not_under_review_properties = []
            for property_set in [apartments, houses, land, commercials]:
                not_under_review_properties.extend([prop.as_dict(session) for prop in property_set])

            if not not_under_review_properties:
                return {'response': 'No approved properties found'}, 404

            return {'response': 'Success', 'data': not_under_review_properties}, 200

        except Exception as e:
            logging.error(f"Error fetching approved properties: {str(e)}")
            return {'response': 'Internal server error'}, 500

        finally:
            if session:
                session.close()


class GetListingsByStatus(Resource):
    def get(self, status):
        session = None
        try:
            session = SessionLocal()

            allowed_statuses = ["vacant", "sold", "rented", "short_stay"]
            if status not in allowed_statuses:
                return {'response': 'Invalid listing type'}, 400

            if status == "sold":
                condition = lambda prop: prop.availability_status == "sold" and prop.purpose == "Sale"
            elif status == "rented":
                condition = lambda prop: prop.availability_status == "rented" and prop.purpose == "Rent"
            elif status == "short_stay":
                condition = lambda prop: prop.purpose == "Short Stay" and prop.availability_status in ["vacant", "occupied"]
            else:  # vacant
                condition = lambda prop: prop.availability_status == "vacant"

            # Fetch and filter properties
            apartments = [prop.as_dict(session) for prop in Apartment.get_active(session) if condition(prop)]
            houses = [prop.as_dict(session) for prop in House.get_active(session) if condition(prop)]
            land = [prop.as_dict(session) for prop in Land.get_active(session) if condition(prop)]
            commercials = [prop.as_dict(session) for prop in Commercial.get_active(session) if condition(prop)]

            filtered_properties = apartments + houses + land + commercials

            if not filtered_properties:
                return {'response': 'No properties found for this listing type'}, 404

            return {'response': 'Success', 'data': filtered_properties}, 200

        except Exception as e:
            logging.error(f"Error fetching {status} properties: {str(e)}")
            return {'response': 'Internal server error'}, 500

        finally:
            if session:
                session.close()


class TogglePropertyDisplay(Resource):
    def post(self, property_type, property_id):
        session = None
        try:
            session = SessionLocal()

            model_map = {
                'apartments': Apartment,
                'houses': House,
                'land': Land,
                'commercial': Commercial
            }

            Model = model_map.get(property_type.lower())
            if not Model:
                return {'response': 'Invalid property type'}, 400

            prop = session.query(Model).filter_by(id=property_id).first()
            if not prop:
                return {'response': 'Property not found'}, 404

            if prop.is_approved != 'approved':
                return {'response': 'Only approved properties can be displayed on landing page'}, 403

            # Toggle display: if display=0, hide it; if display=1, show it
            prop.display = 0 if prop.display == 1 else 1
            session.commit()

            return {
                'response': 'Success',
                'display': bool(prop.display),  # <-- new boolean field
                'message': f'Property display set to {bool(prop.display)}'
            }, 200

        except Exception as e:
            logging.error(f"Error toggling property display: {str(e)}")
            return {'response': 'Internal server error'}, 500

        finally:
            if session:
                session.close()


class PropertySearchResource(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('bedrooms', type=str, required=True, help="Number of bedrooms is required", location='args')
        parser.add_argument('page', type=int, default=1, location='args')
        parser.add_argument('limit', type=int, default=20, location='args')
        args = parser.parse_args()

        bedrooms = args['bedrooms'].strip().lower()  # Normalize input
        page = args['page']
        limit = args['limit']

        session = SessionLocal()

        try:
            # Handle 'bedsitter' as special case
            if bedrooms == "bedsitter":
                filter_condition = Apartment.number_of_bedrooms.ilike("%bedsitter%")
            else:
                filter_condition = Apartment.number_of_bedrooms.ilike(f"%{bedrooms}%")

            results = Apartment.get_active(session).filter(
                filter_condition
            ).all()

            results_dict = [apt.as_dict(session) for apt in results]

            # Pagination
            start = (page - 1) * limit
            end = start + limit
            paged_results = results_dict[start:end]

            return jsonify({
                "results": paged_results,
                "total": len(results_dict),
                "page": page,
                "limit": limit
            })

        finally:
            session.close()


class PropertyLocationSearch(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('keyword', type=str, required=True, help="Location keyword is required", location='args')
        parser.add_argument('page', type=int, default=1, location='args')
        parser.add_argument('limit', type=int, default=20, location='args')
        args = parser.parse_args()

        keyword = args['keyword'].strip()
        page = args['page']
        limit = args['limit']

        session = SessionLocal()

        try:
            keyword_pattern = f"%{keyword}%"

            def query_model(model):
                return model.get_active(session).filter(
                    or_(
                        model.location.ilike(keyword_pattern),
                        model.town.ilike(keyword_pattern),
                        model.locality.ilike(keyword_pattern),
                        model.location_text.ilike(keyword_pattern)
                    )
                ).all()

            all_results = []
            all_results.extend(query_model(Apartment))
            all_results.extend(query_model(House))
            all_results.extend(query_model(Land))
            all_results.extend(query_model(Commercial))

            # Convert to dict
            all_results_dict = [prop.as_dict(session) for prop in all_results]

            # Pagination
            start = (page - 1) * limit
            end = start + limit
            paged_results = all_results_dict[start:end]

            return jsonify({
                "results": paged_results,
                "total": len(all_results_dict),
                "page": page,
                "limit": limit
            })

        finally:
            session.close()


class HouseTypeSearch(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('type', type=str, required=True, help="House type is required", location='args')
        parser.add_argument('page', type=int, default=1, location='args')
        parser.add_argument('limit', type=int, default=20, location='args')
        args = parser.parse_args()

        house_type = args['type'].strip()
        page = args['page']
        limit = args['limit']

        session = SessionLocal()

        try:
            # Search by house_type
            results = House.get_active(session).filter(
                House.house_type.ilike(f"%{house_type}%")
            ).all()

            # Convert results to dict
            results_dict = [house.as_dict(session) for house in results]

            # Pagination
            start = (page - 1) * limit
            end = start + limit
            paged_results = results_dict[start:end]

            return jsonify({
                "results": paged_results,
                "total": len(results_dict),
                "page": page,
                "limit": limit
            })

        finally:
            session.close()


class LandTypeSearch(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('type', type=str, required=True, help="Land type is required", location='args')
        parser.add_argument('page', type=int, default=1, location='args')
        parser.add_argument('limit', type=int, default=20, location='args')
        args = parser.parse_args()

        land_type = args['type'].strip()
        page = args['page']
        limit = args['limit']

        session = SessionLocal()

        try:
            # Search active lands with matching land_type
            results = Land.get_active(session).filter(
                Land.land_type.ilike(f"%{land_type}%")
            ).all()

            # Convert to dict
            results_dict = [land.as_dict(session) for land in results]

            # Paginate
            start = (page - 1) * limit
            end = start + limit
            paged_results = results_dict[start:end]

            return jsonify({
                "results": paged_results,
                "total": len(results_dict),
                "page": page,
                "limit": limit
            })

        finally:
            session.close()


class CommercialTypeSearch(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('type', type=str, required=True, help="Commercial type is required", location='args')
        parser.add_argument('page', type=int, default=1, location='args')
        parser.add_argument('limit', type=int, default=20, location='args')
        args = parser.parse_args()

        commercial_type = args['type'].strip()
        page = args['page']
        limit = args['limit']

        session = SessionLocal()

        try:
            results = Commercial.get_active(session).filter(
                Commercial.commercial_type.ilike(f"%{commercial_type}%")
            ).all()

            results_dict = [item.as_dict(session) for item in results]

            start = (page - 1) * limit
            end = start + limit
            paged_results = results_dict[start:end]

            return jsonify({
                "results": paged_results,
                "total": len(results_dict),
                "page": page,
                "limit": limit
            })

        finally:
            session.close()


class SimilarListings(Resource):
    def get(self, property_type, property_id):
        session = None
        try:
            session = SessionLocal()

            model_map = {
                'apartments': Apartment,
                'houses': House,
                'land': Land,
                'commercial': Commercial
            }

            Model = model_map.get(property_type.lower())
            if not Model:
                return {"message": "Invalid property type"}, 400

            selected_property = session.query(Model).filter_by(id=property_id).first()
            if not selected_property:
                return {"message": "Property not found"}, 404

        
            base_query = session.query(Model).filter(
                Model.id != selected_property.id,
                Model.deleted == 0,
                Model.display == 1,
                Model.is_approved == "approved",
                Model.purpose == selected_property.purpose,
                Model.locality == selected_property.locality,
                Model.town == selected_property.town
            )
            similar_listings = base_query.limit(10).all()


            if len(similar_listings) < 4:
                town_query = session.query(Model).filter(
                    Model.id != selected_property.id,
                    Model.deleted == 0,
                    Model.display == 1,
                    Model.is_approved == "approved",
                    Model.purpose == selected_property.purpose,
                    Model.town == selected_property.town,
                    ~Model.id.in_([prop.id for prop in similar_listings])
                ).limit(10 - len(similar_listings)).all()
                similar_listings.extend(town_query)

            
            if len(similar_listings) < 4:
                location_query = session.query(Model).filter(
                    Model.id != selected_property.id,
                    Model.deleted == 0,
                    Model.display == 1,
                    Model.is_approved == "approved",
                    Model.purpose == selected_property.purpose,
                    Model.location == selected_property.location,
                    ~Model.id.in_([prop.id for prop in similar_listings])
                ).limit(10 - len(similar_listings)).all()
                similar_listings.extend(location_query)

            return {
                "similar_listings": [listing.as_dict(session=session) for listing in similar_listings]
            }, 200

        except Exception as e:
            return {"message": "Server error", "error": str(e)}, 500

        finally:
            if session:
                session.close()


class ChangeApprovalStatus(Resource):
    def put(self):
        parser = reqparse.RequestParser()
        parser.add_argument('property_type', required=True, help='Property type is required')
        parser.add_argument('property_id', required=True, help='Property ID is required')
        parser.add_argument('new_status', required=True, help='New approval status is required')
        args = parser.parse_args()

        session = None
        try:
            session = SessionLocal()
            model = None

            # Map property type to model
            if args['property_type'] == 'apartment':
                model = Apartment
            elif args['property_type'] == 'house':
                model = House
            elif args['property_type'] == 'land':
                model = Land
            elif args['property_type'] == 'commercial':
                model = Commercial
            else:
                return {'response': 'Invalid property type'}, 400

            # Find and update the property
            property_instance = session.query(model).filter_by(id=args['property_id']).first()

            if not property_instance:
                return {'response': 'Property not found'}, 404

            property_instance.is_approved = args['new_status']
            session.commit()

            return {'response': 'Approval status updated successfully'}, 200

        except Exception as e:
            logging.error(f"Error updating approval status: {str(e)}")
            return {'response': 'Internal server error'}, 500

        finally:
            if session:
                session.close()


class GetFullyVerifiedProperties(Resource):
    def get(self):
        session = None
        try:
            session = SessionLocal()

            # Fetch properties that are both approved AND manually verified
            apartments = Apartment.get_approved_and_manually_verified(session)
            houses = House.get_approved_and_manually_verified(session)
            land = Land.get_approved_and_manually_verified(session)
            commercial = Commercial.get_approved_and_manually_verified(session)

            all_verified = []
            for prop_set in [apartments, houses, land, commercial]:
                all_verified.extend([prop.as_dict(session) for prop in prop_set])

            if not all_verified:
                return {'response': 'No fully verified properties found'}, 404

            return {'response': 'Success', 'data': all_verified}, 200

        except Exception as e:
            logging.error(f"Error fetching fully verified properties: {str(e)}")
            return {'response': 'Internal server error'}, 500

        finally:
            if session:
                session.close()


class GetUserApprovedProperties(Resource):
    def get(self, user_id):
        session = None
        try:
            session = SessionLocal()

            # Fetch user's approved properties
            apartments = Apartment.get_active(session, user_id=user_id)
            houses = House.get_active(session, user_id=user_id)
            land = Land.get_active(session, user_id=user_id)
            commercial = Commercial.get_active(session, user_id=user_id)

            # Convert properties to dictionaries
            approved_properties = []
            for property_set in [apartments, houses, land, commercial]:
                approved_properties.extend([prop.as_dict(session) for prop in property_set])

            if not approved_properties:
                return {'response': 'No approved properties found for this user'}, 404

            return {'response': 'Success', 'data': approved_properties}, 200

        except Exception as e:
            logging.error(f"Error fetching user approved properties: {str(e)}")
            return {'response': 'Internal server error'}, 500

        finally:
            if session:
                session.close()


class UserListingsByStatus(Resource):
    def get(self, user_id):
        session = None
        try:
            session = SessionLocal()

            # Normalize status and map to DB-compatible values
            requested_status = request.args.get("status", "").lower()

            status_map = {
                "vacant": "available",   # maps to 'Available' in DB
                "rented": "rented",
                "sold": "sold"
            }

            actual_status = status_map.get(requested_status)

            if not actual_status:
                return {"message": "Invalid or missing 'status' query parameter."}, 400

            # Property model map
            model_map = {
                "apartments": Apartment,
                "houses": House,
                "land": Land,
                "commercial": Commercial
            }

            listings = []

            for model in model_map.values():
                if hasattr(model, "get_by_status_for_user"):
                    results = model.get_by_status_for_user(session, user_id, actual_status)
                    listings.extend([prop.as_dict(session) for prop in results])

            if not listings:
                return {
                    "message": f"No {requested_status} listings found for this user.",
                    "data": []
                }, 200  

            return {
                "message": f"{requested_status.capitalize()} listings fetched successfully.",
                "data": listings
            }, 200

        except Exception as e:
            logging.error(f"Error fetching {requested_status} listings for user {user_id}: {str(e)}")
            return {"message": "Internal server error"}, 500

        finally:
            if session:
                session.close()



# Register the resources with the API
api.add_resource(GetLocations, '/getlocations')
api.add_resource(GetPropertyByLocation, '/getpropertybylocation/<string:location>')
api.add_resource(GetApartments, '/getapartments')
api.add_resource(GetAccomodation, '/getaccomodation')
api.add_resource(GetPropertyByUserId, '/getpropertybyuserid')
api.add_resource(GetAllUnapprovedProperty, '/getallunapprovedproperty')
api.add_resource(GetAllApprovedProperty, '/get-all-approved-properties')
api.add_resource(GetPropertyById, "/getpropertybyid/<string:property_type>/<string:id>")
api.add_resource(GetUserLikeStatus, "/getuserlikestatus/<string:property_id>/<string:user_id>")
api.add_resource(ToggleLike, "/toggle_like/<string:property_id>/<string:user_id>/<string:property_type>")
api.add_resource(GetPropertiesUnderReview, '/under-review')
api.add_resource(GetPropertiesNotUnderReview, '/notunderreview')
api.add_resource(GetListingsByStatus, '/getlistings/<string:status>')
api.add_resource(TogglePropertyDisplay, '/toggle-display/<string:property_type>/<string:property_id>')
api.add_resource(PropertySearchResource, '/propertysearch')
api.add_resource(PropertyLocationSearch, '/propertylocationsearch')
api.add_resource(HouseTypeSearch, '/housetypesearch')
api.add_resource(LandTypeSearch, '/landtypesearch')
api.add_resource(CommercialTypeSearch, '/commercialtypesearch')
api.add_resource(SimilarListings, '/similarlistings/<string:property_type>/<string:property_id>')
api.add_resource(ChangeApprovalStatus, '/update-approval')
api.add_resource(GetFullyVerifiedProperties, '/get-fully-verified-properties')
api.add_resource(GetUserApprovedProperties, '/get-user-approved-properties/<string:user_id>')
api.add_resource(UserListingsByStatus, '/get-user-listings-by-status/<string:user_id>')
