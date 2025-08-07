from flask import Blueprint, request, jsonify, make_response
from flask_cors import cross_origin
from flask_restful import Api, Resource, reqparse
from models import User, Apartment, House, Land, Commercial, Project, ProjectAmenity, ProjectImage, ProjectDocument, ProjectVideo
from models.engine.db_engine import SessionLocal
from celery_server import send_email_task
from datetime import datetime, timezone
from sqlalchemy.exc import SQLAlchemyError
from celery_server import upload_project_images_to_r2, upload_project_documents_to_r2, upload_project_videos_to_r2, delete_project_media_from_r2
import logging
import uuid
import os

project = Blueprint('project', __name__, url_prefix='/projects')

api = Api(project)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@project.route('/', methods=['GET'])
def welcome():
    return "Welcome to projects section"


class CreateProject(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()

            data = {key: request.form[key] for key in request.form}
            files = request.files
            gallery_images = files.getlist("gallery_images[]")
            documents = files.getlist("documents")
            videos = files.getlist("videos")
            cover_image = files.get("cover_image")

            logging.debug(f"Received project data: {data}")
            logging.debug(f"Cover image: {cover_image.filename if cover_image else 'None'}")
            logging.debug(f"Gallery images: {[f.filename for f in gallery_images]}")
            logging.debug(f"Documents: {[d.filename for d in documents]}")
            logging.debug(f"Videos: {[v.filename for v in videos]}")

            # ✅ Validate required fields
            required_fields = ['user_id', 'name', 'location']
            missing = [field for field in required_fields if not data.get(field)]
            if missing:
                return {'message': 'Missing required fields', 'fields': missing}, 400

            # ✅ Validate minimum number of gallery images
            MIN_IMAGES = 4
            MIN_IMAGE_SIZE_MB = 0.05
            if len(gallery_images) < MIN_IMAGES:
                return {
                    "message": f"At least {MIN_IMAGES} gallery images are required.",
                    "provided": len(gallery_images)
                }, 400

            for img in gallery_images:
                img.seek(0, os.SEEK_END)
                size = img.tell()
                img.seek(0)
                if size < MIN_IMAGE_SIZE_MB * 1024 * 1024:
                    return {
                        "message": f"Image {img.filename} is too small.",
                        "min_size": f"{MIN_IMAGE_SIZE_MB}MB"
                    }, 400

            # ✅ Validate documents
            ALLOWED_DOC_FORMATS = {"pdf", "docx", "txt"}
            for doc in documents:
                if doc.filename.split(".")[-1].lower() not in ALLOWED_DOC_FORMATS:
                    return {"message": f"Invalid document: {doc.filename}", "allowed": list(ALLOWED_DOC_FORMATS)}, 400

            # ✅ Validate videos
            ALLOWED_VIDEO_FORMATS = {"mp4", "mov", "avi", "mkv"}
            for vid in videos:
                if vid.filename.split(".")[-1].lower() not in ALLOWED_VIDEO_FORMATS:
                    return {"message": f"Invalid video: {vid.filename}", "allowed": list(ALLOWED_VIDEO_FORMATS)}, 400

            # ✅ Create project record
            project_id = str(uuid.uuid4())
            new_project = Project(
                id=project_id,
                user_id=data['user_id'],
                name=data['name'],
                description=data.get('description'),
                location=data.get('location'),
                status=data.get('status', 'planned'),
                type=data.get('type'),
                budget=data.get('budget'),
                developer_name=data.get('developer_name'),
                start_date=data.get('start_date'),
                end_date=data.get('end_date'),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            session.add(new_project)
            session.commit()

            # ✅ Handle amenities
            amenities_str = data.get("amenities", "")
            if amenities_str:
                for a in [a.strip() for a in amenities_str.split(",") if a.strip()]:
                    session.add(ProjectAmenity(
                        project_id=project_id,
                        amenity=a,
                        created_at=datetime.now(timezone.utc)
                    ))
                session.commit()

            # ✅ Handle cover image upload
            if cover_image:
                image_data = [{
                    "filename": cover_image.filename,
                    "content": cover_image.read(),
                    "content_type": cover_image.content_type,
                    "is_cover": 1
                }]
                upload_project_images_to_r2.delay(data['user_id'], project_id, image_data)

            # ✅ Handle gallery images
            gallery_image_data = []
            for file in gallery_images:
                gallery_image_data.append({
                    "filename": file.filename,
                    "content": file.read(),
                    "content_type": file.content_type,
                    "is_cover": 0
                })
            if gallery_image_data:
                upload_project_images_to_r2.delay(data['user_id'], project_id, gallery_image_data)

            # ✅ Handle documents
            document_data = []
            for doc in documents:
                document_data.append({
                    "filename": doc.filename,
                    "content": doc.read(),
                    "content_type": doc.content_type
                })
            if document_data:
                upload_project_documents_to_r2.delay(data['user_id'], project_id, document_data)

            # ✅ Handle videos
            video_data = []
            for vid in videos:
                video_data.append({
                    "filename": vid.filename,
                    "content": vid.read(),
                    "content_type": vid.content_type
                })
            if video_data:
                upload_project_videos_to_r2.delay(data['user_id'], project_id, video_data)

            return {
                'message': 'Project created successfully. Media is being uploaded.',
                'project_id': project_id
            }, 201

        except Exception as e:
            logging.error(f"Error creating project: {str(e)}")
            return {'message': 'Server error', 'error': str(e)}, 500

        finally:
            if session:
                session.close()


class ListProjects(Resource):
    def get(self, user_id):
        session = SessionLocal()
        try:
            projects = session.query(Project).filter_by(user_id=user_id).all()
            results = []

            for p in projects:
                project_data = p.as_dict(session)

                # Include only non-deleted properties
                project_data["apartments"] = [a.as_dict(session) for a in p.apartments if getattr(a, "deleted", 0) == 0]
                project_data["houses"] = [h.as_dict(session) for h in p.houses if getattr(h, "deleted", 0) == 0]
                project_data["land"] = [l.as_dict(session) for l in p.land if getattr(l, "deleted", 0) == 0]
                project_data["commercial"] = [c.as_dict(session) for c in p.commercial if getattr(c, "deleted", 0) == 0]

                # ✅ Count total non-deleted units
                project_data["number_of_units"] = (
                    len(project_data["apartments"]) +
                    len(project_data["houses"]) +
                    len(project_data["land"]) +
                    len(project_data["commercial"])
                )

                results.append(project_data)

            return {"projects": results}, 200
        finally:
            session.close()


class UserProperties(Resource):
    def get(self, user_id, property_type=None):
        session = SessionLocal()
        try:
            model_map = {
                'apartment': Apartment,
                'house': House,
                'land': Land,
                'commercial': Commercial
            }

            results = []

            if property_type:
                model = model_map.get(property_type.lower())
                if not model:
                    return {"message": "Invalid property type"}, 400

                properties = session.query(model).filter_by(user_id=user_id, deleted=0).all()
                for p in properties:
                    prop_data = p.as_dict(session)
                    prop_data["type"] = property_type
                    results.append(prop_data)

                return {"properties": results}, 200

            # Get all properties if no specific type is given
            for prop_type, model in model_map.items():
                properties = session.query(model).filter_by(user_id=user_id, deleted=0).all()
                for p in properties:
                    prop_data = p.as_dict(session)
                    prop_data["type"] = prop_type
                    results.append(prop_data)

            return {"properties": results}, 200

        finally:
            session.close()



class AssignPropertyToProject(Resource):
    def post(self):
        session = SessionLocal()
        try:
            data = request.get_json()
            project_id = data.get("project_id")
            property_type = data.get("property_type")  # 'apartment', 'house', etc.
            property_ids = data.get("property_ids")

            # Validate required fields
            if not project_id or not property_type or not property_ids:
                return {"message": "Missing required fields"}, 400

            if isinstance(property_ids, str):
                property_ids = [property_ids]
            elif not isinstance(property_ids, list):
                return {"message": "property_ids must be a string or a list"}, 400

            # Validate property type
            model_map = {
                'apartment': Apartment,
                'house': House,
                'land': Land,
                'commercial': Commercial
            }

            model = model_map.get(property_type.lower())
            if not model:
                return {"message": "Invalid property type"}, 400

            # Validate project
            project = session.query(Project).filter_by(id=project_id).first()
            if not project:
                return {"message": "Project not found"}, 404

            # Fetch properties, ignoring soft-deleted ones
            props = session.query(model).filter(model.id.in_(property_ids), model.deleted == 0).all()
            if not props:
                return {"message": "No valid properties found for assignment"}, 404

            for prop in props:
                prop.project_id = project_id

            session.commit()

            assigned_props = [prop.as_dict(session) for prop in props]

            return {
                "message": f"{len(assigned_props)} {property_type}(s) successfully assigned to project '{project.name}'",
                "project": {
                    "id": project.id,
                    "name": project.name
                },
                "assigned_properties": assigned_props
            }, 200

        except Exception as e:
            session.rollback()
            return {"message": "Server error", "error": str(e)}, 500
        finally:
            session.close()


class UpdateProject(Resource):
    def put(self, project_id):
        session = None
        try:
            session = SessionLocal()
            data = request.form.to_dict()
            files = request.files
            gallery_images = files.getlist("gallery_images[]")
            documents = files.getlist("documents")
            videos = files.getlist("videos")
            cover_image = files.get("cover_image")

            logging.debug(f"Updating project {project_id} with data: {data}")

            project = session.query(Project).filter_by(id=project_id).first()
            if not project:
                return {'message': 'Project not found'}, 404

            # ✅ Update fields if provided
            for field in ['name', 'description', 'location', 'status', 'type', 'budget', 'developer_name', 'start_date', 'end_date']:
                if field in data:
                    setattr(project, field, data[field])

            project.updated_at = datetime.now(timezone.utc)
            session.commit()

            # ✅ Update amenities
            if "amenities" in data:
                # Delete old amenities
                session.query(ProjectAmenity).filter_by(project_id=project_id).delete()
                session.commit()

                amenities_str = data.get("amenities", "")
                for a in [a.strip() for a in amenities_str.split(",") if a.strip()]:
                    session.add(ProjectAmenity(
                        project_id=project_id,
                        amenity=a,
                        created_at=datetime.now(timezone.utc)
                    ))
                session.commit()

            # ✅ Media: Cover Image
            if cover_image:
                image_data = [{
                    "filename": cover_image.filename,
                    "content": cover_image.read(),
                    "content_type": cover_image.content_type,
                    "is_cover": 1
                }]
                upload_project_images_to_r2.delay(project.user_id, project_id, image_data)

            # ✅ Media: Gallery Images
            gallery_image_data = []
            for file in gallery_images:
                file.seek(0, os.SEEK_END)
                size = file.tell()
                file.seek(0)
                if size < 0.05 * 1024 * 1024:
                    return {
                        "message": f"Image {file.filename} is too small.",
                        "min_size": "0.05MB"
                    }, 400
                gallery_image_data.append({
                    "filename": file.filename,
                    "content": file.read(),
                    "content_type": file.content_type,
                    "is_cover": 0
                })
            if gallery_image_data:
                upload_project_images_to_r2.delay(project.user_id, project_id, gallery_image_data)

            # ✅ Media: Documents
            ALLOWED_DOC_FORMATS = {"pdf", "docx", "txt"}
            document_data = []
            for doc in documents:
                if doc.filename.split(".")[-1].lower() not in ALLOWED_DOC_FORMATS:
                    return {"message": f"Invalid document: {doc.filename}"}, 400
                document_data.append({
                    "filename": doc.filename,
                    "content": doc.read(),
                    "content_type": doc.content_type
                })
            if document_data:
                upload_project_documents_to_r2.delay(project.user_id, project_id, document_data)

            # ✅ Media: Videos
            ALLOWED_VIDEO_FORMATS = {"mp4", "mov", "avi", "mkv"}
            video_data = []
            for vid in videos:
                if vid.filename.split(".")[-1].lower() not in ALLOWED_VIDEO_FORMATS:
                    return {"message": f"Invalid video: {vid.filename}"}, 400
                video_data.append({
                    "filename": vid.filename,
                    "content": vid.read(),
                    "content_type": vid.content_type
                })
            if video_data:
                upload_project_videos_to_r2.delay(project.user_id, project_id, video_data)

            return {
                "message": "Project updated successfully",
                "project_id": project.id
            }, 200

        except Exception as e:
            logging.error(f"Error updating project {project_id}: {str(e)}")
            return {'message': 'Server Error', 'error': str(e)}, 500

        finally:
            if session:
                session.close()



class DeleteProject(Resource):
    def delete(self, project_id):
        session = None
        try:
            session = SessionLocal()
            project = session.query(Project).filter_by(id=project_id).first()

            if not project:
                return {'message': 'Project not found'}, 404

            user_id = project.user_id

            # ✅ Collect media URLs before deletion
            image_urls = [img.image_url for img in project.images]
            doc_urls = [doc.document_url for doc in project.documents]
            video_urls = [vid.video_url for vid in project.videos]

            # ✅ Detach linked properties
            detached_apartments = session.query(Apartment).filter_by(project_id=project_id).update({'project_id': None}, synchronize_session=False)
            detached_houses = session.query(House).filter_by(project_id=project_id).update({'project_id': None}, synchronize_session=False)
            detached_land = session.query(Land).filter_by(project_id=project_id).update({'project_id': None}, synchronize_session=False)
            detached_commercial = session.query(Commercial).filter_by(project_id=project_id).update({'project_id': None}, synchronize_session=False)

            # ✅ Delete DB entries for media & project
            session.query(ProjectAmenity).filter_by(project_id=project_id).delete(synchronize_session=False)
            session.query(ProjectImage).filter_by(project_id=project_id).delete(synchronize_session=False)
            session.query(ProjectDocument).filter_by(project_id=project_id).delete(synchronize_session=False)
            session.query(ProjectVideo).filter_by(project_id=project_id).delete(synchronize_session=False)
            session.delete(project)
            session.commit()

            # ✅ Trigger R2 deletion tasks
            if image_urls:
                delete_project_media_from_r2.delay(object_keys=image_urls)

            if doc_urls:
                delete_project_media_from_r2.delay(object_keys=doc_urls)

            if video_urls:
                delete_project_media_from_r2.delay(object_keys=video_urls)


            logging.info(f"Deleted project {project_id} and cleaned up R2 media.")

            return {
                'message': 'Project deleted successfully. Media is being removed from R2.',
                'detached_properties': {
                    'apartments': detached_apartments,
                    'houses': detached_houses,
                    'land': detached_land,
                    'commercial': detached_commercial
                }
            }, 200

        except Exception as e:
            session.rollback()
            logging.error(f"Error deleting project {project_id}: {str(e)}")
            return {'message': 'Server Error', 'error': str(e)}, 500

        finally:
            if session:
                session.close()



class RemovePropertyFromProject(Resource):
    def put(self):
        session = None
        try:
            session = SessionLocal()
            data = request.form.to_dict()

            property_id = data.get("property_id")
            property_type = data.get("property_type")  # e.g., 'apartment'

            if not property_id or not property_type:
                return {"message": "Missing required fields"}, 400

            model_map = {
                'apartment': Apartment,
                'house': House,
                'land': Land,
                'commercial': Commercial
            }

            model = model_map.get(property_type.lower())
            if not model:
                return {"message": "Invalid property type"}, 400

            property_obj = session.query(model).filter_by(id=property_id).first()

            if not property_obj:
                return {"message": "Property not found"}, 404

            property_obj.project_id = None
            session.commit()

            return {"message": f"{property_type.capitalize()} removed from project"}, 200

        except Exception as e:
            logging.error(f"Error removing property from project: {str(e)}")
            return {"message": "Server Error", "error": str(e)}, 500

        finally:
            if session:
                session.close()


class GetAllProjects(Resource):
    def get(self):
        session = None
        try:
            session = SessionLocal()
            projects = session.query(Project).all()
            project_list = []

            for p in projects:
                # Fetch related media
                images = session.query(ProjectImage).filter_by(project_id=p.id).all()
                documents = session.query(ProjectDocument).filter_by(project_id=p.id).all()
                videos = session.query(ProjectVideo).filter_by(project_id=p.id).all()
                amenities = session.query(ProjectAmenity).filter_by(project_id=p.id).all()

                # Count non-deleted units
                apartment_units = [a for a in p.apartments if getattr(a, "deleted", 0) == 0]
                house_units = [h for h in p.houses if getattr(h, "deleted", 0) == 0]
                land_units = [l for l in p.land if getattr(l, "deleted", 0) == 0]
                commercial_units = [c for c in p.commercial if getattr(c, "deleted", 0) == 0]
                number_of_units = len(apartment_units) + len(house_units) + len(land_units) + len(commercial_units)

                # Split cover image and gallery
                cover_image = next((img.as_dict() for img in images if img.is_cover), None)
                gallery_images = [img.as_dict() for img in images if not img.is_cover]

                project_data = {
                    "id": p.id,
                    "user_id": p.user_id,
                    "name": p.name,
                    "description": p.description,
                    "location": p.location,
                    "status": p.status,
                    "type": p.type,
                    "budget": p.budget,
                    "developer_name": p.developer_name,
                    "start_date": str(p.start_date) if p.start_date else None,
                    "end_date": str(p.end_date) if p.end_date else None,
                    "created_at": str(p.created_at),
                    "updated_at": str(p.updated_at),

                    "number_of_units": number_of_units,  
                    # Media
                    "cover_image": cover_image,
                    "gallery_images": gallery_images,
                    "documents": [doc.as_dict() for doc in documents],
                    "videos": [vid.as_dict() for vid in videos],
                    "amenities": [a.amenity for a in amenities]
                }

                project_list.append(project_data)


            return {"projects": project_list}, 200

        except Exception as e:
            logging.error(f"Error fetching all project data: {str(e)}")
            return {"message": "Server error", "error": str(e)}, 500

        finally:
            if session:
                session.close()


class GetProjectProperties(Resource):
    def get(self, project_id):
        session = SessionLocal()
        try:
            project = session.query(Project).filter_by(id=project_id).first()
            if not project:
                return {"message": "Project not found"}, 404

            project_data = project.as_dict(session)

            # Fetch non-deleted properties
            project_data["apartments"] = [
                a.as_dict(session) for a in project.apartments if getattr(a, "deleted", 0) == 0
            ]
            project_data["houses"] = [
                h.as_dict(session) for h in project.houses if getattr(h, "deleted", 0) == 0
            ]
            project_data["land"] = [
                l.as_dict(session) for l in project.land if getattr(l, "deleted", 0) == 0
            ]
            project_data["commercial"] = [
                c.as_dict(session) for c in project.commercial if getattr(c, "deleted", 0) == 0
            ]

            # Compute number of total units
            project_data["number_of_units"] = (
                len(project_data["apartments"]) +
                len(project_data["houses"]) +
                len(project_data["land"]) +
                len(project_data["commercial"])
            )

            return {"project": project_data}, 200

        finally:
            session.close()

class SubmitInterest(Resource):
    def options(self):
        return {}, 200
    
    def post(self):
        session = None
        try:
            session = SessionLocal()
            
            data = request.json

            # Validate required fields
            required_fields = ['firstName', 'lastName', 'emailAddress', 'phoneNumber', 'project_id']
            missing_fields = [field for field in required_fields if field not in data or not data[field]]
            if missing_fields:
                return {'response': 'Missing required fields', 'fields': missing_fields}, 400

            # Basic email validation
            email = data.get('emailAddress', '').strip()
            if '@' not in email or '.' not in email:
                return {'response': 'Invalid email format'}, 400

            # Get the project and its owner
            project_id = data.get('project_id')
            project = session.query(Project).filter_by(id=project_id).first()
            if not project:
                return {'response': 'Project not found'}, 404
            
            project_owner = session.query(User).filter_by(user_id=project.user_id).first()
            if not project_owner:
                return {'response': 'Project owner not found'}, 404

            # Check if project owner has an email
            if not hasattr(project_owner, 'email') or not project_owner.email:
                return {'response': 'Project owner email not available'}, 400

            # Prepare email context for the project owner
            interested_person_name = f"{data['firstName']} {data['lastName']}"
            context = {
                "project_name": project.name,
                "project_location": project.location,
                "interested_person_name": interested_person_name,
                "interested_person_email": email,
                "interested_person_phone": data['phoneNumber'],
                "message": data.get('message', 'No additional message provided'),
                "submission_time": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
            }

            # Send email to the project owner
            send_email_task.delay(
                sender_email='bookings@merimedevelopment.co.ke',
                recipient_email=project_owner.email, 
                subject=f"New Interest in Your Project: {project.name}",
                template_name="project_interest_notification.html",
                context=context
            )

            # Send a confirmation email to the interested person
            confirmation_context = {
                "user_name": interested_person_name,
                "project_name": project.name,
                "project_location": project.location,
                "submission_time": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
            }

            send_email_task.delay(
                sender_email='bookings@merimedevelopment.co.ke',
                recipient_email=email,
                subject=f"Interest Submission Confirmed for {project.name}",
                template_name="interest_submission.html",
                context=confirmation_context
            )

            return {
                'response': 'Interest submitted successfully. Project owner has been notified.',
                'project_name': project.name
            }, 201

        except Exception as e:
            logging.error(f"Error during interest submission: {str(e)}")
            return {'response': 'Internal server error'}, 500

        finally:
            if session:
                session.close()

# Register the resources with the API
api.add_resource(CreateProject, '/createproject', methods=['POST', 'OPTIONS'])
api.add_resource(ListProjects, '/listusersprojects/<string:user_id>')
api.add_resource(UserProperties, '/userproperties/<user_id>', '/userproperties/<user_id>/<property_type>')
api.add_resource(AssignPropertyToProject,'/assignpropertyproject')
api.add_resource(UpdateProject, '/updateprojects/<string:project_id>')
api.add_resource(DeleteProject, "/deleteprojects/<string:project_id>")
api.add_resource(RemovePropertyFromProject, '/removepropertyfromproject')
api.add_resource(GetAllProjects, '/getallprojects')
api.add_resource(GetProjectProperties, '/projectsproperties/<string:project_id>')
api.add_resource(SubmitInterest, '/submitinterest', methods=['POST', 'OPTIONS'])






