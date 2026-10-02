import threading

router_context = threading.local()

class RouterContextMiddleware:
    """Middleware to set request context for database routing."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        router_context.method = request.method
        router_context.path = request.path
        try:
            return self.get_response(request)
        finally:
            router_context.method = None
            router_context.path = None

class PrimaryReplicasRouter:
    """
    Routes read queries to the replica for GET requests on heavy read paths.
    """
    def db_for_read(self, model, **hints):
        method = getattr(router_context, 'method', None)
        path = getattr(router_context, 'path', '')
        
        if method == 'GET':
            if (path.startswith('/api/reports/') or 
                path.startswith('/api/enrollments/') or 
                path.startswith('/api/attendance/')):
                return 'replica'
                
        return 'default'

    def db_for_write(self, model, **hints):
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        db_set = {'default', 'replica'}
        if obj1._state.db in db_set and obj2._state.db in db_set:
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        return True
