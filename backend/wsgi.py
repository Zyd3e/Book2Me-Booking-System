from dotenv import load_dotenv
import os
import importlib.util

# Load environment variables from backend/.env (if present)
HERE = os.path.dirname(__file__)
load_dotenv(os.path.join(HERE, '.env'))

# Import the top-level app.py module (avoid package name collision with 'app' package)
app_py_path = os.path.join(HERE, 'app.py')
spec = importlib.util.spec_from_file_location('app_module', app_py_path)
app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_module)

# Create the Flask application using the factory from app.py
app = app_module.create_app()

if __name__ == '__main__':
    # Development run
    debug = os.getenv('FLASK_ENV', 'production') != 'production'
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=debug)
