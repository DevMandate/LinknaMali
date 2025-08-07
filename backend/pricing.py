from flask import Blueprint, request
from flask_cors import CORS
from flask_restful import Api, Resource
from models import PremiumTier, Promotion, TierFeature, AddOn
from models.engine.db_engine import SessionLocal
import logging
import uuid

pricing = Blueprint('pricing', __name__)
api = Api(pricing)
CORS(pricing, resources={
    r"/pricing/*": {
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


@pricing.route('/', methods=['GET'])
def welcome():
    return "Welcome to Pricing page"


# add a new premium tier
class PremiumTierResource(Resource):
    def post(self):
        """Admin creates a new premium tier"""
        data = request.get_json()
        required_fields = ['name']

        # Validate required fields
        for field in required_fields:
            if field not in data:
                return {"error": f"'{field}' is required."}, 400

        # Create a new premium tier
        session = SessionLocal()
        try:
            new_tier = PremiumTier(
                id=str(uuid.uuid4()),  # Generate UUID for ID
                name=data['name'],
                price=data.get('price'),
                description=data.get('description'),
                max_listings=data.get('max_listings'),
                is_active=data.get('is_active', True)
            )
            session.add(new_tier)
            session.commit()
            return {"message": "Premium tier created successfully", "tier": new_tier.as_dict()}, 201
        except Exception as e:
            session.rollback()
            logger.error(f"Error creating premium tier: {str(e)}")
            return {"error": str(e)}, 500
        finally:
            session.close()


# fetch all premium tiers
class PremiumTierListResource(Resource):
    def get(self):
        """Get a list of all premium tiers"""
        session = SessionLocal()
        try:
            tiers = session.query(PremiumTier).order_by(PremiumTier.price).all()
            return {"tiers": [tier.as_dict() for tier in tiers]}, 200
        except Exception as e:
            logger.error(f"Error fetching premium tiers: {str(e)}")
            return {"error": "Failed to fetch premium tiers"}, 500
        finally:
            session.close()


# edit an existing premium tier
class UpdatePremiumTierResource(Resource):
    def put(self, tier_id):
        """Admin updates an existing premium tier"""
        data = request.get_json()
        session = SessionLocal()

        try:
            tier = session.query(PremiumTier).filter_by(id=tier_id).first()

            if not tier:
                return {"error": "Premium tier not found"}, 404

            # Update fields if present in request
            if 'name' in data:
                tier.name = data['name']
            if 'price' in data:
                tier.price = data['price']
            if 'description' in data:
                tier.description = data['description']
            if 'max_listings' in data:
                tier.max_listings = data['max_listings']
            if 'is_active' in data:
                tier.is_active = data['is_active']

            session.commit()
            return {"message": "Premium tier updated successfully", "tier": tier.as_dict()}, 200
        except Exception as e:
            session.rollback()
            logger.error(f"Error updating premium tier: {str(e)}")
            return {"error": str(e)}, 500
        finally:
            session.close()


# delete a premium tier
class PremiumTierDeleteResource(Resource):
    def delete(self, tier_id):
        """Admin deletes a premium tier permanently"""
        session = SessionLocal()

        try:
            tier = session.query(PremiumTier).filter_by(id=tier_id).first()

            if not tier:
                return {"error": "Premium tier not found"}, 404

            session.delete(tier)
            session.commit()
            return {"message": "Premium tier deleted successfully"}, 200

        except Exception as e:
            session.rollback()
            logger.error(f"Error deleting premium tier: {str(e)}")
            return {"error": str(e)}, 500
        finally:
            session.close()


# add a new promotion
class PromotionResource(Resource):
    def post(self):
        """Admin creates a new promotion"""
        data = request.get_json()
        required_fields = ['title', 'type']

        for field in required_fields:
            if field not in data:
                return {"error": f"'{field}' is required."}, 400

        session = SessionLocal()
        try:
            new_promo = Promotion(
                id=str(uuid.uuid4()),
                title=data['title'],
                type=data['type'],
                applies_to_tier_id=data.get('applies_to_tier_id'),
                discount=data.get('discount'),
                promo_code=data.get('promo_code'),
                start_date=data.get('start_date'),
                end_date=data.get('end_date')
            )
            session.add(new_promo)
            session.commit()
            return {"message": "Promotion created successfully", "promotion": new_promo.as_dict()}, 201
        except Exception as e:
            session.rollback()
            logger.error(f"Error creating promotion: {str(e)}")
            return {"error": str(e)}, 500
        finally:
            session.close()


# fetch all promotions
class PromotionListResource(Resource):
    def get(self):
        """Fetch all promotions"""
        session = SessionLocal()
        try:
            promotions = session.query(Promotion).all()
            return {
                "promotions": [promo.as_dict() for promo in promotions]
            }, 200
        except Exception as e:
            logger.error(f"Error fetching promotions: {str(e)}")
            return {"error": str(e)}, 500
        finally:
            session.close()


# edit an existing promotion
class UpdatePromotionResource(Resource):
    def put(self, promo_id):
        """Admin updates an existing promotion"""
        data = request.get_json()
        session = SessionLocal()

        try:
            promo = session.query(Promotion).filter_by(id=promo_id).first()

            if not promo:
                return {"error": "Promotion not found"}, 404

            # Update fields if provided
            if 'title' in data:
                promo.title = data['title']
            if 'type' in data:
                promo.type = data['type']
            if 'applies_to_tier_id' in data:
                promo.applies_to_tier_id = data['applies_to_tier_id']
            if 'discount' in data:
                promo.discount = data['discount']
            if 'promo_code' in data:
                promo.promo_code = data['promo_code']
            if 'start_date' in data:
                promo.start_date = data['start_date']
            if 'end_date' in data:
                promo.end_date = data['end_date']

            session.commit()
            return {"message": "Promotion updated successfully", "promotion": promo.as_dict()}, 200

        except Exception as e:
            session.rollback()
            logger.error(f"Error updating promotion: {str(e)}")
            return {"error": str(e)}, 500
        finally:
            session.close()


# delete a specific promotion
class PromotionDeleteResource(Resource):
    def delete(self, promo_id):
        """Admin deletes a promotion permanently"""
        session = SessionLocal()

        try:
            promo = session.query(Promotion).filter_by(id=promo_id).first()

            if not promo:
                return {"error": "Promotion not found"}, 404

            session.delete(promo)
            session.commit()
            return {"message": "Promotion deleted successfully"}, 200

        except Exception as e:
            session.rollback()
            logger.error(f"Error deleting promotion: {str(e)}")
            return {"error": str(e)}, 500
        finally:
            session.close()


# add a new tier feature
class TierFeatureResource(Resource):
    def post(self):
        """Admin creates a new tier feature for a premium tier."""
        data = request.get_json()
        required_fields = ['tier_id', 'feature_name']

        for field in required_fields:
            if field not in data:
                return {"error": f"'{field}' is required."}, 400

        session = SessionLocal()
        try:
            new_feature = TierFeature(
                id=str(uuid.uuid4()),
                tier_id=data['tier_id'],
                feature_name=data['feature_name'],
                value=data.get('value'),
                category=data.get('category'),
                tooltip=data.get('tooltip')
            )
            session.add(new_feature)
            session.commit()
            return {"message": "Tier feature created successfully", "feature": new_feature.as_dict()}, 201
        except Exception as e:
            session.rollback()
            logger.error(f"Error creating tier feature: {str(e)}")
            return {"error": str(e)}, 500
        finally:
            session.close()


# fetch all tier features
class TierFeatureListResource(Resource):
    def get(self):
        """Fetch all tier features"""
        session = SessionLocal()
        try:
            features = session.query(TierFeature).all()
            return {
                "tier_features": [feature.as_dict() for feature in features]
            }, 200
        except Exception as e:
            logger.error(f"Error fetching tier features: {str(e)}")
            return {"error": str(e)}, 500
        finally:
            session.close()


# edit an existing tier feature
class UpdateTierFeatureResource(Resource):
    def put(self, feature_id):
        """Admin updates an existing tier feature"""
        data = request.get_json()
        session = SessionLocal()

        try:
            feature = session.query(TierFeature).filter_by(id=feature_id).first()

            if not feature:
                return {"error": "Tier feature not found"}, 404

            # Update fields if present
            if 'tier_id' in data:
                feature.tier_id = data['tier_id']
            if 'feature_name' in data:
                feature.feature_name = data['feature_name']
            if 'value' in data:
                feature.value = data['value']
            if 'category' in data:
                feature.category = data['category']
            if 'tooltip' in data:
                feature.tooltip = data['tooltip']

            session.commit()
            return {"message": "Tier feature updated successfully", "feature": feature.as_dict()}, 200

        except Exception as e:
            session.rollback()
            logger.error(f"Error updating tier feature: {str(e)}")
            return {"error": str(e)}, 500
        finally:
            session.close()


# delete a tier feature
class TierFeatureDeleteResource(Resource):
    def delete(self, feature_id):
        """Admin deletes a tier feature permanently"""
        session = SessionLocal()

        try:
            feature = session.query(TierFeature).filter_by(id=feature_id).first()

            if not feature:
                return {"error": "Tier feature not found"}, 404

            session.delete(feature)
            session.commit()
            return {"message": "Tier feature deleted successfully"}, 200

        except Exception as e:
            session.rollback()
            logger.error(f"Error deleting tier feature: {str(e)}")
            return {"error": str(e)}, 500
        finally:
            session.close()


#  add a new add-on
class AddOnResource(Resource):
    def post(self):
        """Create a new add-on"""
        data = request.get_json()
        required_fields = ['name']

        for field in required_fields:
            if field not in data:
                return {"error": f"'{field}' is required."}, 400

        session = SessionLocal()
        try:
            new_addon = AddOn(
                id=str(uuid.uuid4()),
                name=data['name'],
                description=data.get('description'),
                price_min=data.get('price_min'),
                price_max=data.get('price_max'),
                is_monthly=data.get('is_monthly', False),
                included_in_tier_id=data.get('included_in_tier_id')
            )
            session.add(new_addon)
            session.commit()
            return {
                "message": "Add-on created successfully",
                "addon": new_addon.as_dict()
            }, 201
        except Exception as e:
            session.rollback()
            logger.error(f"Error creating add-on: {str(e)}")
            return {"error": str(e)}, 500
        finally:
            session.close()


# fetch all add-ons
class AddOnListResource(Resource):
    def get(self):
        """Fetch all add-ons"""
        session = SessionLocal()
        try:
            addons = session.query(AddOn).all()
            return {
                "addons": [addon.as_dict() for addon in addons]
            }, 200
        except Exception as e:
            logger.error(f"Error fetching add-ons: {str(e)}")
            return {"error": str(e)}, 500
        finally:
            session.close()


# edit an existing add-on
class UpdateAddOnResource(Resource):
    def put(self, addon_id):
        """Admin updates an existing add-on"""
        data = request.get_json()
        session = SessionLocal()

        try:
            addon = session.query(AddOn).filter_by(id=addon_id).first()

            if not addon:
                return {"error": "Add-on not found"}, 404

            # Update fields if present in the request
            if 'name' in data:
                addon.name = data['name']
            if 'description' in data:
                addon.description = data['description']
            if 'price_min' in data:
                addon.price_min = data['price_min']
            if 'price_max' in data:
                addon.price_max = data['price_max']
            if 'is_monthly' in data:
                addon.is_monthly = data['is_monthly']
            if 'included_in_tier_id' in data:
                addon.included_in_tier_id = data['included_in_tier_id']

            session.commit()
            return {
                "message": "Add-on updated successfully",
                "addon": addon.as_dict()
            }, 200

        except Exception as e:
            session.rollback()
            logger.error(f"Error updating add-on: {str(e)}")
            return {"error": str(e)}, 500
        finally:
            session.close()


# delete an add-on
class AddOnDeleteResource(Resource):
    def delete(self, addon_id):
        """Admin deletes an add-on permanently"""
        session = SessionLocal()

        try:
            addon = session.query(AddOn).filter_by(id=addon_id).first()

            if not addon:
                return {"error": "Add-on not found"}, 404

            session.delete(addon)
            session.commit()
            return {"message": "Add-on deleted successfully"}, 200

        except Exception as e:
            session.rollback()
            logger.error(f"Error deleting add-on: {str(e)}")
            return {"error": str(e)}, 500
        finally:
            session.close()



# register the resource with the API
api.add_resource(PremiumTierResource, '/createpremiumtiers') 
api.add_resource(PremiumTierListResource, '/fetchpremiumtiers')
api.add_resource(UpdatePremiumTierResource, '/updatepremiumtier/<string:tier_id>')
api.add_resource(PremiumTierDeleteResource, '/deletepremiumtier/<string:tier_id>')
api.add_resource(PromotionResource, '/createpromotion')
api.add_resource(PromotionListResource, '/fetchpromotions')
api.add_resource(UpdatePromotionResource, '/updatepromotion/<string:promo_id>')
api.add_resource(PromotionDeleteResource, '/deletepromotion/<string:promo_id>')
api.add_resource(TierFeatureResource, '/createtierfeatures')
api.add_resource(TierFeatureListResource, '/fetchtierfeatures')
api.add_resource(UpdateTierFeatureResource, '/updatetierfeature/<string:feature_id>')
api.add_resource(TierFeatureDeleteResource, '/deletetierfeature/<string:feature_id>')
api.add_resource(AddOnResource, '/createaddons')
api.add_resource(AddOnListResource, '/fetchaddons')
api.add_resource(UpdateAddOnResource, '/updateaddon/<string:addon_id>')
api.add_resource(AddOnDeleteResource, '/deleteaddon/<string:addon_id>')