from flask_restful import Resource, reqparse, Api
from flask import request, jsonify, Blueprint
from flask_cors import CORS
from models import ListingAgent, Apartment, House, Land, Commercial
from models.engine.db_engine import SessionLocal
import uuid
import traceback
import logging


listingagents = Blueprint('listingagents', __name__,)
api = Api(listingagents)
CORS(listingagents, resources={
    r"/listingagents/*": {
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


@listingagents.route('/', methods=['GET'])
def welcome():
    return "Welcome to Listing Agents Blueprint!"


# Register a new listing agent
class RegisterListingAgent(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('name', required=True, help='Agent name is required')
        parser.add_argument('email', required=True, help='Email is required')

        args = parser.parse_args()
        session = SessionLocal()

        try:
            existing_agent = session.query(ListingAgent).filter_by(email=args['email']).first()
            if existing_agent:
                return {'message': 'An agent with this email already exists.'}, 409

            new_agent = ListingAgent(
                agent_id=str(uuid.uuid4()),
                name=args['name'],
                email=args['email']
            )

            session.add(new_agent)
            session.commit()

            return {
                'message': 'Agent registered successfully.',
                'agent': {
                    'agent_id': new_agent.agent_id,
                    'name': new_agent.name,
                    'email': new_agent.email,
                    'unique_identifier': new_agent.unique_identifier
                }
            }, 201

        except Exception as e:
            session.rollback()
            traceback.print_exc()
            return {'message': 'Internal server error', 'error': str(e)}, 500

        finally:
            session.close()


# Update a listing agent
class UpdateListingAgent(Resource):
    def put(self, agent_id):
        """Update a listing agent's details"""
        parser = reqparse.RequestParser()
        parser.add_argument('name', required=False)
        parser.add_argument('email', required=False)

        args = parser.parse_args()
        session = SessionLocal()

        try:
            agent = session.query(ListingAgent).filter_by(agent_id=agent_id).first()
            if not agent:
                return {'message': 'Agent not found.'}, 404

            if args['email']:
                # Check if another agent is using the same email
                existing_agent = session.query(ListingAgent).filter(ListingAgent.email == args['email'], ListingAgent.agent_id != agent_id).first()
                if existing_agent:
                    return {'message': 'Another agent with this email already exists.'}, 409
                agent.email = args['email']

            if args['name']:
                agent.name = args['name']

            session.commit()

            return {
                'message': 'Agent updated successfully.',
                'agent': {
                    'agent_id': agent.agent_id,
                    'name': agent.name,
                    'email': agent.email,
                    'unique_identifier': agent.unique_identifier
                }
            }, 200

        except Exception as e:
            session.rollback()
            traceback.print_exc()
            return {'message': 'Internal server error', 'error': str(e)}, 500

        finally:
            session.close()


# Delete a listing agent
class DeleteListingAgent(Resource):
    def delete(self, agent_id):
        """Delete a listing agent by ID"""
        session = SessionLocal()

        try:
            agent = session.query(ListingAgent).filter_by(agent_id=agent_id).first()
            if not agent:
                return {'message': 'Agent not found.'}, 404

            session.delete(agent)
            session.commit()

            return {'message': 'Agent deleted successfully.'}, 200

        except Exception as e:
            session.rollback()
            traceback.print_exc()
            return {'message': 'Internal server error', 'error': str(e)}, 500

        finally:
            session.close()


# Fetch all listing agents
class ListListingAgents(Resource):
    def get(self):
        """Get a list of all registered listing agents"""
        session = SessionLocal()
        try:
            agents = session.query(ListingAgent).all()
            agent_list = [
                {
                    'agent_id': agent.agent_id,
                    'name': agent.name,
                    'email': agent.email,
                    'unique_identifier': agent.unique_identifier,
                    'is_active': agent.is_active
                }
                for agent in agents
            ]
            return {'agents': agent_list}, 200

        except Exception as e:
            traceback.print_exc()
            return {'message': 'Internal server error', 'error': str(e)}, 500

        finally:
            session.close()


# Link an agent to a property listing
class LinkAgentToListing(Resource):
    def post(self, property_type, property_id):
        parser = reqparse.RequestParser()
        parser.add_argument('agent_id', required=True, help='Agent ID is required')
        args = parser.parse_args()

        model_map = {
            'apartments': Apartment,
            'houses': House,
            'land': Land,
            'commercial': Commercial
        }

        if property_type not in model_map:
            return {'message': 'Invalid property type'}, 400

        session = SessionLocal()
        try:
            model = model_map[property_type]

            # Get the property listing
            listing = session.query(model).filter_by(id=property_id, deleted=0).first()
            if not listing:
                return {'message': f'{property_type.capitalize()} listing not found'}, 404

            # Verify the agent exists
            agent = session.query(ListingAgent).filter_by(agent_id=args['agent_id']).first()
            if not agent:
                return {'message': 'Listing agent not found'}, 404

            # Link the agent
            listing.verified_by_agent_id = agent.agent_id
            session.commit()

            return {'message': f'{property_type.capitalize()} successfully linked to agent'}, 200

        except Exception as e:
            session.rollback()
            return {'message': f'Internal server error: {str(e)}'}, 500

        finally:
            session.close()


# Unlink an agent from a property listing
class UnlinkAgentFromListing(Resource):
    def delete(self, property_type, property_id):
        parser = reqparse.RequestParser()
        parser.add_argument('agent_id', required=True, help='Agent ID is required')
        args = parser.parse_args()

        model_map = {
            'apartments': Apartment,
            'houses': House,
            'land': Land,
            'commercial': Commercial
        }

        if property_type not in model_map:
            return {'message': 'Invalid property type'}, 400

        session = SessionLocal()
        try:
            model = model_map[property_type]

            # Get the property listing
            listing = session.query(model).filter_by(id=property_id, deleted=0).first()
            if not listing:
                return {'message': f'{property_type.capitalize()} listing not found'}, 404

            # Verify the agent is currently linked
            if not listing.verified_by_agent_id:
                return {'message': 'No agent currently linked to this listing'}, 400

            if listing.verified_by_agent_id != args['agent_id']:
                return {'message': 'This agent is not currently linked to the listing'}, 400

            # Unlink the agent
            listing.verified_by_agent_id = None
            session.commit()

            return {'message': f'Agent successfully unlinked from {property_type}'}, 200

        except Exception as e:
            session.rollback()
            return {'message': f'Internal server error: {str(e)}'}, 500

        finally:
            session.close()

# Get all listings for a specific agent
class GetAgentListings(Resource):
    def get(self, agent_id):
        session = SessionLocal()
        try:
            # Verify the agent exists
            agent = session.query(ListingAgent).filter_by(agent_id=agent_id).first()
            if not agent:
                return {'message': 'Listing agent not found'}, 404

            # Query all property types for this agent
            results = {
                'apartments': [],
                'houses': [],
                'land': [],
                'commercial': []
            }

            # Property type models
            property_types = {
                'apartments': Apartment,
                'houses': House,
                'land': Land,
                'commercial': Commercial
            }

            # Query each property type
            for prop_type, model in property_types.items():
                listings = session.query(model).filter(
                    model.verified_by_agent_id == agent_id,
                    model.deleted == 0
                ).all()
                
                for listing in listings:
                    results[prop_type].append({
                        'id': listing.id,
                        'title': getattr(listing, 'title', None),
                        'address': getattr(listing, 'address', None),
                        # Add other relevant fields
                    })

            return {
                'agent_id': agent_id,
                'agent_name': agent.name,  
                'agent_email': agent.email,
                'listings': results,
                'total_listings': sum(len(v) for v in results.values())
            }, 200

        except Exception as e:
            return {'message': f'Internal server error: {str(e)}'}, 500
        finally:
            session.close()
            
# Toggle agents status active/inactive
class ToggleAgentStatus(Resource):
    def put(self):
        parser = reqparse.RequestParser()
        parser.add_argument('agent_id', required=True, help='Agent ID is required')
        parser.add_argument('new_status', type=bool, required=True, help='New status is required')

        args = parser.parse_args()
        session = SessionLocal()

        try:
            agent = session.query(ListingAgent).filter_by(agent_id=args['agent_id']).first()
            if not agent:
                return {'message': 'Agent not found'}, 404

            agent.is_active = args['new_status']
            session.commit()

            return {'message': f'Agent status updated to {"active" if args["new_status"] else "inactive"}.'}, 200

        except Exception as e:
            session.rollback()
            return {'message': 'Internal server error', 'error': str(e)}, 500

        finally:
            session.close()

# List active/Inactive agents
class ListAgents(Resource):
    def get(self):
        # Use request.args directly for now
        status = request.args.get('status')
        if status not in ['active', 'inactive']:
            return {'message': 'Invalid status'}, 400

        is_active = True if status == 'active' else False

        session = SessionLocal()
        try:
            agents = session.query(ListingAgent).filter_by(is_active=is_active).all()

            return {
                'agents': [
                    {
                        'agent_id': agent.agent_id,
                        'name': agent.name,
                        'email': agent.email,
                        'unique_identifier': agent.unique_identifier,
                        'is_active': agent.is_active
                    }
                    for agent in agents
                ]
            }, 200
        finally:
            session.close()


# Register the resource with the API
api.add_resource(RegisterListingAgent, '/registeragents')
api.add_resource(UpdateListingAgent, '/updateagents/<string:agent_id>')
api.add_resource(DeleteListingAgent, '/deleteagents/<string:agent_id>')
api.add_resource(ListListingAgents, '/fetchlistingagents')
api.add_resource(LinkAgentToListing, '/linkagent/<string:property_type>/<string:property_id>')
api.add_resource(UnlinkAgentFromListing, '/unlinkagent/<string:property_type>/<string:property_id>')
api.add_resource(GetAgentListings, '/getagentlistings/<string:agent_id>')
api.add_resource(ToggleAgentStatus, '/agents/toggle-status')
api.add_resource(ListAgents, '/agents/list')

