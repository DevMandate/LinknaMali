from flask import Blueprint, request
from flask_cors import CORS
from flask_restful import Api, Resource
from celery_server import send_email_task
from utils.Auth import sanitize_data
import logging

support = Blueprint('support', __name__, url_prefix='/support')
api = Api(support)
CORS(support, resources={
    r"/support/*": {
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

@support.route('/', methods=['GET'])
def welcome():
    return "Welcome to Support"

class Feedback(Resource):
    def post(self):
        try:
            data = request.json
            data = sanitize_data(data)
            user_name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
            
            context = {
                'user_name': user_name,
                'email': data.get('email'),
                'role': data.get('role'),
                'message': data.get('message'),
            } 

            send_email_task.delay(
                sender_email='noreply@merimedevelopment.co.ke',
                recipient_email="support@merimedevelopment.co.ke",
                subject="Linknamali - Feedback Received",
                template_name="feedback.html",
                context=context
            )

            return {'response': 'Feedback sent successfully'}, 200

        except Exception as e:
            logging.error(f"Error sending feedback: {str(e)}")
            return {'response': 'Server error. Please try again later.'}, 500
        
api.add_resource(Feedback, "/feedback")
