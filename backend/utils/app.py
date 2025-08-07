from flask import Flask, jsonify
from flask_restful import Api, Resource




# starts
app = Flask(__name__)
api = Api(app)


class ResourcePost(Resource):
    def post(self):
        return jsonify({'response':'Resource Post is Triggered'})
    
class ResourceGet(Resource): 
    def get(self): 
        return jsonify({'response': 'Resource Get is Triggered'})
    
class ResourcePut(Resource):
    def put(self):
        return jsonify({'response':'Resource Put is Triggered'})
    
class ResourceDelete(Resource):
    def delete(self):
        return jsonify({'response':'Resource Delete is Triggered'})
    

# Endpoints for every resource
api.add_resource(ResourcePost, '/post_resource')
api.add_resource(ResourceGet, '/get_resource')
api.add_resource(ResourcePut, '/put_resource')
api.add_resource(ResourceDelete, '/delete_resource')


# app.run(debug=True)
# stops