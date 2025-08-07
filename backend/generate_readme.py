from flask import Flask
import os
import inspect
import sys
import re


os.environ["GENERATING_README"] = "true"

import linknamali  # Ensure the full module is imported
from linknamali import app  # Get the app instance AFTER module import
from flask_restful import Api

# Define the correct path where README.md should be saved
BACKEND_FOLDER = os.path.dirname(os.path.abspath(__file__))
README_PATH = os.path.join(BACKEND_FOLDER, "README.md")
LINKNAMALI_PATH = os.path.join(BACKEND_FOLDER, "linknamali.py")


def extract_imports():
    """Extract all import statements from linknamali.py."""
    if not os.path.exists(LINKNAMALI_PATH):
        print("❌ linknamali.py not found!")
        return ["No imports found."]

    imports = []
    with open(LINKNAMALI_PATH, "r", encoding="utf-8") as file:
        for line in file:
            line = line.strip()
            if line.startswith("import ") or line.startswith("from "):
                imports.append(line)

    return imports if imports else ["No imports found."]


def extract_blueprints():
    """Extract all registered blueprints from linknamali.py."""
    if not os.path.exists(LINKNAMALI_PATH):
        print("❌ linknamali.py not found!")
        return ["No Blueprints found."]

    blueprints = []
    with open(LINKNAMALI_PATH, "r", encoding="utf-8") as file:
        content = file.read()

    # Match "app.register_blueprint(blueprint_name)"
    pattern = re.findall(r"app\.register_blueprint\(([\w]+)\)", content)
    
    for blueprint in pattern:
        match = re.search(rf"from\s+([\w\.]+)\s+import\s+{blueprint}", content)
        if match:
            module = match.group(1)
            blueprints.append(f"- `{blueprint}` from `{module}`")
        else:
            blueprints.append(f"- `{blueprint}` (module unknown)")

    return blueprints if blueprints else ["No Blueprints found."]



def get_resource_docstring(resource_class, method):
    """Extracts docstring from a resource method if available."""
    method_func = getattr(resource_class, method.lower(), None)
    return method_func.__doc__.strip() if method_func and method_func.__doc__ else "No description"



def get_routes():
    """Extract all registered routes from Flask app, including Flask-RESTful and Blueprints."""
    routes = []
    api_resources = set()
    blueprint_routes = {}

    if not app.url_map:
        print("❌ No URL map found. Are Blueprints properly registered?")
        return []

    # Find Flask-RESTful API instances
    for attr_name in dir(app):
        attr = getattr(app, attr_name)
        if isinstance(attr, Api):  # Check if it's a Flask-RESTful API
            for resource, route_info in attr.resources.items():
                for route in route_info[0]:
                    methods = ', '.join(route_info[1])  # Allowed methods
                    api_resources.add((methods, route, resource.__name__))

    # Extract function-based and Blueprint routes
    for rule in app.url_map.iter_rules():
        if rule.endpoint != 'static':  # Exclude static files
            methods = ', '.join(rule.methods - {'HEAD', 'OPTIONS'})  # Exclude unnecessary HTTP methods
            doc = app.view_functions[rule.endpoint].__doc__ or "No description"

            # Identify if the route belongs to a Blueprint
            blueprint_name = rule.endpoint.split(".")[0] if "." in rule.endpoint else "Main App"
            if blueprint_name not in blueprint_routes:
                blueprint_routes[blueprint_name] = []

            blueprint_routes[blueprint_name].append(f"| {methods} | `{rule.rule}` | {doc.strip()} |")

    # Generate a structured route list
    route_sections = []

    # Add general Flask routes
    if "Main App" in blueprint_routes:
        route_sections.append("### General Flask Routes")
        route_sections.append("| Method | Endpoint | Description |")
        route_sections.append("|--------|----------|-------------|")
        route_sections.extend(blueprint_routes.pop("Main App"))

    # Add Blueprint-specific routes
    for bp_name, bp_routes in blueprint_routes.items():
        route_sections.append(f"### `{bp_name}` Blueprint Routes")
        route_sections.append("| Method | Endpoint | Description |")
        route_sections.append("|--------|----------|-------------|")
        route_sections.extend(bp_routes)

    # Add Flask-RESTful API Resources
    if api_resources:
        route_sections.append("### Flask-RESTful API Routes")
        route_sections.append("| Method | Endpoint | Description |")
        route_sections.append("|--------|----------|-------------|")
        for method, route, resource_name in api_resources:
            routes.append(f"| {method} | `{route}` | `{resource_name}` |")

    return route_sections if route_sections else ["No registered routes found."]



def get_functions():
    """Extract function names and docstrings from your main Flask app"""
    functions = []
    for name, func in inspect.getmembers(app.view_functions, inspect.isfunction):
        doc = inspect.getdoc(func) or "No description"
        functions.append(f"- `{name}`: {doc.strip()}")
    return functions


def generate_readme():
    print("DEBUG: generate_readme() is running...")
    """Generate README.md dynamically inside the backend folder."""
    if not os.path.exists(BACKEND_FOLDER):
        os.makedirs(BACKEND_FOLDER)

    imports = extract_imports()
    blueprints = extract_blueprints()
    routes = get_routes()
    functions = get_functions()

    imports_section = "\n".join([f"- `{imp}`" for imp in imports])
    blueprints_section = "\n".join(blueprints)
    routes_section = "\n".join(routes) if routes else "No registered routes found."
    functions_section = "\n".join(functions) if functions else "No documented functions found."

    readme_content = f"""
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
   venv\\Scripts\\activate   # On Windows
   pip install -r requirements.txt
   python linknamali.py  # Run the Flask app
   ```
## Imported Modules
{imports_section}

## Registered Blueprints
{blueprints_section}


## Available Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
{routes_section}

## Available Functions
{functions_section}
"""
    print("DEBUG: Writing to README.md...")  # <-- Add this before file writing

    # Write the README content to the file
    with open(README_PATH, "w", encoding="utf-8") as readme_file:
        readme_file.write(readme_content)

    # print(f"DEBUG: Routes Collected: {routes}")
    # print(f"DEBUG: Functions Collected: {functions}")
    print(f"✅ README.md successfully updated at {README_PATH}")

if __name__ == "__main__":
    print("DEBUG: generate_readme.py script is running...")
    generate_readme()