from models.project_image import ProjectImage
from models.project_document import ProjectDocument
from models.project_video import ProjectVideo

def get_project_images(session, user_id, project_id):
    return [img.as_dict() for img in session.query(ProjectImage).filter_by(user_id=user_id, project_id=project_id).all()]

def get_project_cover_image(session, user_id, project_id):
    cover = session.query(ProjectImage).filter_by(user_id=user_id, project_id=project_id, is_cover=1).first()
    return cover.as_dict() if cover else None

def get_project_documents(session, user_id, project_id):
    return [doc.as_dict() for doc in session.query(ProjectDocument).filter_by(user_id=user_id, project_id=project_id).all()]

def get_project_videos(session, user_id, project_id):
    return [vid.as_dict() for vid in session.query(ProjectVideo).filter_by(user_id=user_id, project_id=project_id).all()]
