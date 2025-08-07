from flask_restful import Resource, reqparse, Api
from flask import Blueprint
from flask_cors import CORS
from sqlalchemy import asc, desc, or_, func
from decimal import Decimal
from models import Apartment, Commercial, House, Land, Amenities
from models.engine.db_engine import SessionLocal
import logging
import os
from sqlalchemy.dialects import mysql

search_engine = Blueprint('search_engine', __name__, url_prefix='/engine')
api = Api(search_engine)
CORS(search_engine, resources={r"/engine/*": {"origins": ["http://localhost:5173", "https://linknamali.ke"]}})

log_file = "/srv/Merime/logs/search.log"  # Full path to log file

# Ensure directory exists
os.makedirs(os.path.dirname(log_file), exist_ok=True)

# Create logger
logger = logging.getLogger("search_logger")
logger.setLevel(logging.DEBUG)  # Set log level

# Create file handler
file_handler = logging.FileHandler(log_file)
file_handler.setLevel(logging.DEBUG)

# Create formatter and add it to handler
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)

# Add file handler to logger
logger.addHandler(file_handler)

# Also log to console
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

@search_engine.route('/', methods=['GET'])
def welcome():
    return "Welcome to Search Engine"

class Search(Resource):
    def get(self):
        session = None
        try:
            session = SessionLocal()
            parser = reqparse.RequestParser()
            parser.add_argument('query', type=str, location='args')
            parser.add_argument('purpose', type=str, location='args')
            parser.add_argument('location', type=str, location='args')
            parser.add_argument('town', type=str, location='args')
            parser.add_argument('locality', type=str, location='args')
            parser.add_argument('property_type', type=str, location='args')
            parser.add_argument('min_price', type=Decimal, location='args')
            parser.add_argument('max_price', type=Decimal, location='args')
            parser.add_argument('amenities', type=str, location='args')
            parser.add_argument('sort_by', type=str, location='args', choices=('price', 'date'))
            parser.add_argument('order', type=str, location='args', choices=('asc', 'desc'))
            parser.add_argument('limit', type=int, location='args', default=10)
            parser.add_argument('page', type=int, location='args', default=1)

            args = parser.parse_args()
            logger.debug(f"Parsed arguments: {args}")

            models = {
                "apartments": Apartment,
                "houses": House,
                "land": Land,
                "commercial": Commercial
            }

        
            requested_property_types = args['property_type'].split(',') if args['property_type'] else models.keys()
            results = {}
            all_properties = [] 
            # Loop over the property types and query the corresponding models
            for property_type, model in models.items():
                # Skip this model if it's not in the requested types
                if property_type not in requested_property_types:
                    continue

                query = model.get_active(session)
                if args['query']:
                    search_term = f"%{args['query']}%"

                    if model.__tablename__ == "houses":
                        query = query.filter(
                            or_(
                                model.house_type.ilike(search_term),
                                model.location.ilike(search_term),
                                model.town.ilike(search_term),
                                model.locality.ilike(search_term),
                                model.description.ilike(search_term)
                            )
                        )
                    else:
                        query = query.filter(
                            or_(
                                model.title.ilike(search_term),
                                model.location.ilike(search_term),
                                model.town.ilike(search_term),
                                model.locality.ilike(search_term),
                                model.description.ilike(search_term)
                            )
                        )
                   
                if args['town']:
                    query = query.filter(model.town == args['town'])
                if args['locality']:
                    query = query.filter(model.locality == args['locality'])
                if args['purpose']:
                    query = query.filter(model.purpose == args['purpose'])
                if args['location']:
                    query = query.filter(model.location == args['location'])
                if args['min_price']:
                    query = query.filter(model.price >= args['min_price'])
                if args['max_price']:
                    query = query.filter(model.price <= args['max_price'])

                # if args['sort_by']:
                #     sort_column = model.price if args['sort_by'] == 'price' else model.created_at
                #     #Note that it orders per model not the whole dataset
                #     logger.info(f"Sorting by {args['sort_by']} column: {sort_column} order: {args['order']}")
                #     if args['order'] == 'desc':
                #         query = query.order_by(desc(sort_column))
                #     else:
                #         query = query.order_by(asc(sort_column))

                paginated_query = query.limit(args['limit']).offset((args['page'] - 1) * args['limit'])
                logger.info(f"Paginated query: {paginated_query}")
                properties = paginated_query.all()

                if properties:
                    if args['sort_by']:
                         all_properties.extend(
                        [{"property_type": property_type, **property.as_dict(session)} for property in properties]
                        )
                    else:
                        results[property_type] = [{"property_type": property_type, **property.as_dict(session)} for property in properties]

            if args['sort_by']:
                if not all_properties:
                    return {"message": "No properties found.", "data": []}, 404
            else:
                if not any(results.values()):
                    return {"message": "No properties found.", "data": results}, 404

            #Sort the properties
            if args['sort_by']:
                if args['amenities']:
                    requested_amenities = args['amenities'].split(',')
                    logger.debug(f"Filtering by amenities: {requested_amenities}")

                    # Count matching amenities
                    match_counts = {
                        prop["id"]: session.query(func.count(Amenities.amenity))
                        .filter(Amenities.property_id == prop["id"], Amenities.amenity.in_(requested_amenities))
                        .scalar()
                        for prop in all_properties
                    }

                    # Add match_count to properties
                    for prop in all_properties:
                        prop["match_count"] = match_counts.get(prop["id"], 0)

                    # Sort by match count first, then price/date
                    sort_key = "price" if args['sort_by'] == "price" else "created_at"
                    reverse_order = args['order'] == "asc"

                    all_properties.sort(
                        key=lambda x: (-x["match_count"], x[sort_key] if args['sort_by'] else 0),
                        reverse=reverse_order
                    )
                else:
                    # Regular sorting if no amenities
                    sort_key = "price" if args['sort_by'] == "price" else "created_at"
                    reverse_order = args['order'] == "desc"
                    all_properties.sort(key=lambda x: x[sort_key], reverse=reverse_order)

                return {"message": "Properties fetched successfully.", "data": all_properties}, 200


            return {"message": "Properties fetched successfully.", "data": results}, 200

        except Exception as e:
            return {"message": "An error occurred", "error": str(e)}, 500

        finally:
            if session:
                session.close()

api.add_resource(Search, '/search')

# {
#     "query": "beach" -> title, location, description
#     "purpose": "rent",
#     "location": "Mombasa",
#     "property_type": "apartments,houses",
#     "min_price": 50000,
#     "max_price": 150000,
#     "amenities": "swimming pool,parking,gym",
#     "sort_by": "price",
#     "order": "desc",
#     "limit": 5,
#     "page": 1 -> 10 listings per page.
# }