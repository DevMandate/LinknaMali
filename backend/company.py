
from flask_restful import Resource, reqparse, Api
from flask import request, jsonify, Blueprint, make_response, redirect
from flask_cors import CORS
from models import Company, User, CompanyUserLink
from models.engine.db_engine import SessionLocal
from celery_server import send_email_task
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta, timezone
from auth import SECRET_KEY
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.company_invitation import CompanyInvitation
import secrets




import uuid
import traceback
import logging
import jwt 


company = Blueprint('company', __name__,)
api = Api(company)
CORS(company, resources={
    r"/company/*": {
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


@company.route('/', methods=['GET'])
def welcome():
    return "Welcome to companies Blueprint!"



class CreateCompany(Resource):
    def post(self):
        session = SessionLocal()

        try:
            # Parse input
            parser = reqparse.RequestParser()
            parser.add_argument('user_id', required=True, help='User ID is required')
            parser.add_argument('name', required=True, help='Company name is required')
            parser.add_argument('email', required=False)
            parser.add_argument('phone_number', required=False)
            args = parser.parse_args()

            # Fetch the user
            user = session.query(User).filter_by(user_id=args['user_id'], is_deleted=False).first()
            if not user:
                return {'message': 'User not found'}, 404

            # Ensure user does not already belong to a company
            if user.company_id:
                return {'message': 'User is already associated with a company.'}, 409

            # Check if company name already exists
            existing_company = session.query(Company).filter_by(name=args['name']).first()
            if existing_company:
                return {'message': 'Company name is already taken.'}, 409

            # Create a new company
            new_company = Company(
                company_id=str(uuid.uuid4()),
                name=args['name'],
                email=args.get('email'),
                phone_number=args.get('phone_number'),
                company_owner_id=user.user_id  
            )

            session.add(new_company)
            session.flush()  # Ensure new_company.company_id is generated

            # Associate user with this company
            user.company_id = new_company.company_id
            user.is_company_admin_approved = False  # Await admin approval

            link = CompanyUserLink(
                company_id=new_company.company_id,
                user_id=user.user_id,
                role="admin",
                is_accepted=True,
                invited_by=None
            )
            session.add(link)

            session.commit()

            return {
                'message': 'Company profile created successfully. Awaiting admin approval.',
                'company': {
                    'company_id': new_company.company_id,
                    'name': new_company.name,
                    'email': new_company.email,
                    'phone_number': new_company.phone_number,
                    'status': 'pending_approval'
                }
            }, 201

        except Exception as e:
            session.rollback()
            traceback.print_exc()
            logger.error(f"Error creating company: {str(e)}")
            return {'message': 'Internal server error', 'error': str(e)}, 500

        finally:
            session.close()


class GetMyCompany(Resource):
    def get(self):
        session = SessionLocal()

        try:
            # Correct location for GET query parameters
            parser = reqparse.RequestParser()
            parser.add_argument('user_id', required=True, help='User ID is required', location='args')
            args = parser.parse_args()

            # Fetch the user
            user = session.query(User).filter_by(user_id=args['user_id'], is_deleted=False).first()
            if not user:
                return {'message': 'User not found'}, 404

            if not user.company_id:
                return {'message': 'User is not associated with any company'}, 404

            # Fetch the company
            company = session.query(Company).filter_by(company_id=user.company_id).first()
            if not company:
                return {'message': 'Company not found'}, 404

            # Return full company details
            return {
                'company': {
                    'company_id': company.company_id,
                    'name': company.name,
                    'email': company.email,
                    'phone_number': company.phone_number,
                    'status': company.status,
                    'rejection_reason': company.rejection_reason,
                    'created_at': company.created_at.isoformat() if company.created_at else None,
                    'updated_at': company.updated_at.isoformat() if company.updated_at else None,
                    'company_owner_id': company.company_owner_id,
                }
            }, 200

        except Exception as e:
            session.rollback()
            traceback.print_exc()
            logger.error(f"Error fetching company: {str(e)}")
            return {'message': 'Internal server error', 'error': str(e)}, 500

        finally:
            session.close()


class ApproveOrRejectCompany(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('company_id', required=True, help='Company ID is required')
        parser.add_argument('action', choices=('approve', 'reject'), required=True, help='Action must be approve or reject')
        parser.add_argument('rejection_reason', required=False, help='Rejection reason (required if rejecting)')

        args = parser.parse_args()
        session = None

        try:
            session = SessionLocal()

            company = session.query(Company).filter_by(company_id=args['company_id']).first()
            if not company:
                return {'message': 'Company not found'}, 404

            # Fetch the first user who created/registered the company
            user = session.query(User).filter_by(company_id=company.company_id).first()
            if not user:
                return {'message': 'No user associated with this company'}, 404

            user_name = f"{user.first_name} {user.last_name}"
            user_email = user.email

            # Determine action
            if args['action'] == 'approve':
                company.status = 'approved'
                user.role = 'company_admin'
                user.is_company_admin_approved = True

                # Prepare email context
                context = {
                    "user_name": user_name,
                    "company_name": company.name,
                    "status": "approved",
                    "dashboard_url": "https://linknamali.ke/company-dashboard"
                }

                send_email_task.delay(
                    sender_email='support@merimedevelopment.co.ke',
                    recipient_email=user_email,
                    subject="LinknaMali - Company Approved",
                    template_name="company_status_update.html",
                    context=context
                )

            elif args['action'] == 'reject':
                if not args['rejection_reason']:
                    return {'message': 'Rejection reason is required when rejecting.'}, 400

                company.status = 'rejected'
                company.rejection_reason = args['rejection_reason']

                context = {
                    "user_name": user_name,
                    "company_name": company.name,
                    "status": "rejected",
                    "rejection_reason": args['rejection_reason']
                }

                send_email_task.delay(
                    sender_email='support@merimedevelopment.co.ke',
                    recipient_email=user_email,
                    subject="LinknaMali - Company Rejected",
                    template_name="company_status_update.html",
                    context=context
                )

            session.commit()
            return {'message': f'Company {args["action"]}ed successfully and email sent'}, 200

        except SQLAlchemyError as e:
            if session:
                session.rollback()
            logging.error(f"Database error during company {args['action']}: {str(e)}")
            return {'message': 'Database error'}, 500

        except Exception as e:
            if session:
                session.rollback()
            traceback.print_exc()
            logging.error(f"Unexpected error during company {args['action']}: {str(e)}")
            return {'message': 'Internal Server Error', 'error': str(e)}, 500

        finally:
            if session:
                session.close()


class InviteCompanyUser(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            data = request.json
            email = data.get('email')
            company_id = data.get('company_id')
            invited_by = data.get('invited_by')
            role = data.get('role', 'member')  # default role

            if not email or not company_id or not invited_by:
                return {'response': 'Missing required fields'}, 400

            # Check if invite already exists and not expired
            existing_invite = session.query(CompanyInvitation).filter_by(email=email, company_id=company_id, is_accepted=False).first()
            if existing_invite and existing_invite.expiry > datetime.utcnow():
                return {'response': 'An active invitation already exists for this email'}, 400

            # Generate token
            token = str(uuid.uuid4())

            # Create invitation
            invitation = CompanyInvitation(
                email=email,
                company_id=company_id,
                invited_by=invited_by,
                role=role,
                token=token
            )
            session.add(invitation)
            session.commit()

            # Prepare email context
            invite_link = f"https://linknamali.ke/signup?token={token}&email={email}"
            context = {
                'invite_link': invite_link,
                'role': role
            }

            send_email_task.delay(
                sender_email='support@merimedevelopment.co.ke',
                recipient_email=email,
                subject='LinknaMali Collaboration Invite',
                template_name='company_invite_email.html',
                context=context
            )

            return {
                'response': f"{email} Invitation sent successfully as {role}",
                'company_id': company_id,
                'invitation_token': token,
                'invited_by': invited_by,
                'role': role
                }, 201

        except Exception as e:
            logging.error(f"Error inviting user: {str(e)}")
            return {'response': 'Server error. Please try again later.'}, 500
        finally:
            if session:
                session.close()


class GetCompanies(Resource):
    def get(self):
        session = SessionLocal()

        try:
            # Parse query parameters
            parser = reqparse.RequestParser()
            parser.add_argument('name', type=str, required=False, location='args', help='Filter by company name')
            parser.add_argument('page', type=int, required=False, default=1, location='args')
            parser.add_argument('per_page', type=int, required=False, default=10, location='args')
            args = parser.parse_args()

            query = session.query(Company)

            # Optional filter by name
            if args['name']:
                query = query.filter(Company.name.ilike(f"%{args['name']}%"))

            total = query.count()
            companies = query.offset((args['page'] - 1) * args['per_page']).limit(args['per_page']).all()

            results = [{
                'company_id': company.company_id,
                'name': company.name,
                'email': company.email,
                'phone_number': company.phone_number
            } for company in companies]

            return {
                'total': total,
                'page': args['page'],
                'per_page': args['per_page'],
                'companies': results
            }, 200

        except Exception as e:
            traceback.print_exc()
            logger.error(f"Error fetching companies: {str(e)}")
            return {'message': 'Internal server error', 'error': str(e)}, 500

        finally:
            session.close()


class GetCompanyUsers(Resource):
    def get(self, company_id):
        session = SessionLocal()

        try:
            users = []

            # --- 1. Fetch accepted users (linked to the company) ---
            links = session.query(CompanyUserLink).filter_by(company_id=company_id).all()
            for link in links:
                user = session.query(User).filter_by(user_id=link.user_id, is_deleted=False).first()
                if user:
                    users.append({
                        'type': 'user',
                        'user_id': user.user_id,
                        'name': f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email,
                        'email': user.email,
                        'role': link.role,
                        'is_accepted': True,
                        'invited_by': link.invited_by,
                        'invited_on': link.created_at.isoformat() if hasattr(link, 'created_at') else None
                    })

            # --- 2. Fetch pending invitations ---
            pending_invites = session.query(CompanyInvitation).filter_by(company_id=company_id, is_accepted=False).all()
            for invite in pending_invites:
                users.append({
                    'type': 'invitation',
                    'user_id': None,
                    'name': invite.email,
                    'email': invite.email,
                    'role': invite.role,
                    'is_accepted': False,
                    'invited_by': invite.invited_by,
                    'invited_on': invite.created_at.isoformat() if hasattr(invite, 'created_at') else None
                })

            if not users:
                return {'message': 'No users or invites found for this company.'}, 404

            return {
                'company_id': company_id,
                'total_users': len(users),
                'users': users
            }, 200

        except Exception as e:
            traceback.print_exc()
            logger.error(f"Error fetching company users: {str(e)}")
            return {'message': 'Internal server error', 'error': str(e)}, 500

        finally:
            session.close()


class EditCompany(Resource):
    def put(self, company_id):
        session = SessionLocal()

        try:
            # Parse input
            parser = reqparse.RequestParser()
            parser.add_argument('name', required=False)
            parser.add_argument('email', required=False)
            parser.add_argument('phone_number', required=False)
            args = parser.parse_args()

            # Fetch company
            company = session.query(Company).filter_by(company_id=company_id).first()
            if not company:
                return {'message': 'Company not found'}, 404

            # Optionally update fields
            if args['name']:
                # Check for name uniqueness
                existing = session.query(Company).filter(Company.name == args['name'], Company.company_id != company_id).first()
                if existing:
                    return {'message': 'Company name already in use.'}, 409
                company.name = args['name']

            if args['email']:
                company.email = args['email']

            if args['phone_number']:
                company.phone_number = args['phone_number']

            session.commit()

            return {'message': 'Company updated successfully'}, 200

        except Exception as e:
            session.rollback()
            traceback.print_exc()
            logger.error(f"Error updating company: {str(e)}")
            return {'message': 'Internal server error', 'error': str(e)}, 500

        finally:
            session.close()


class DeleteCompany(Resource):
    def delete(self, company_id):
        session = SessionLocal()

        try:
            # Parse input for admin verification
            parser = reqparse.RequestParser()
            parser.add_argument('admin_user_id', required=True, help='Admin User ID is required')
            args = parser.parse_args()

            # Verify if user is an admin
            admin_user = session.query(User).filter_by(user_id=args['admin_user_id'], is_admin=True).first()
            if not admin_user:
                return {'message': 'Unauthorized. Only admins can delete companies.'}, 403

            # Fetch the company
            company = session.query(Company).filter_by(company_id=company_id).first()
            if not company:
                return {'message': 'Company not found'}, 404

            # Delete the company permanently
            session.delete(company)
            session.commit()

            return {'message': 'Company permanently deleted by admin.'}, 200

        except Exception as e:
            session.rollback()
            traceback.print_exc()
            logger.error(f"Error deleting company: {str(e)}")
            return {'message': 'Internal server error', 'error': str(e)}, 500

        finally:
            session.close()


class RemoveUserFromCompany(Resource):
    def delete(self):
        data = request.get_json()

        # Validate input
        admin_user_id = data.get('admin_user_id')
        target_email = data.get('target_email')

        if not admin_user_id or not target_email:
            return {'message': 'admin_user_id and target_email are required.'}, 400

        session = SessionLocal()

        try:
            # 1. Validate Admin
            admin_user = session.query(User).filter_by(user_id=admin_user_id, is_deleted=False).first()
            if not admin_user or not admin_user.company_id or not admin_user.is_company_admin_approved:
                return {'message': 'Unauthorized. You must be an approved company admin to remove users.'}, 403

            company_id = admin_user.company_id
            target_email = target_email.strip().lower()

            # 2. Attempt to revoke invitation if it exists and not accepted
            invite = session.query(CompanyInvitation).filter_by(
                email=target_email,
                company_id=company_id,
                is_accepted=False
            ).first()

            if invite:
                session.delete(invite)
                session.commit()
                return {'message': 'Invitation revoked successfully.'}, 200

            # 3. Attempt to unlink an already accepted user (if no pending invite)
            target_user = session.query(User).filter_by(email=target_email, is_deleted=False).first()
            if not target_user:
                return {'message': 'User not found in system.'}, 404

            # Prevent admin from removing themselves
            if target_user.user_id == admin_user.user_id:
                return {'message': 'Admins cannot remove themselves from the company.'}, 400

            user_link = session.query(CompanyUserLink).filter_by(
                company_id=company_id,
                user_id=target_user.user_id
            ).first()

            if not user_link:
                return {'message': 'User is not linked to your company.'}, 404

            # Unlink user
            session.delete(user_link)

            # Clear company-related fields on the user (optional cleanup)
            if target_user.company_id == company_id:
                target_user.company_id = None
            if target_user.pending_company_id == company_id:
                target_user.pending_company_id = None

            session.commit()

            return {'message': 'User removed from the company successfully.'}, 200

        except Exception as e:
            session.rollback()
            traceback.print_exc()
            return {'message': 'Internal server error', 'error': str(e)}, 500

        finally:
            session.close()

            

# register the resource with the API
api.add_resource(CreateCompany, '/createcompany')
api.add_resource(GetMyCompany, '/getmycompany')
api.add_resource(ApproveOrRejectCompany, '/approve-rejectcompany')
api.add_resource(InviteCompanyUser, '/invite-user')
api.add_resource(GetCompanies, '/get-companies')
api.add_resource(GetCompanyUsers, '/get-company-users/<string:company_id>')
api.add_resource(EditCompany, '/edit-company/<string:company_id>')
api.add_resource(DeleteCompany, '/delete-company/<string:company_id>')
api.add_resource(RemoveUserFromCompany, '/remove-user-from-company')