import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'task_manager.settings')

# This line is CRITICAL - it creates the 'application' variable
application = get_wsgi_application()