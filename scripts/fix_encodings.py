files = {
    'backend/api/__init__.py': '''from backend.api.routes_digital_twin import router as digital_twin_router
from backend.api.routes_decisions import router as decisions_router
from backend.api.routes_export import router as export_router
from backend.api.routes_health import router as health_router

__all__ = ["digital_twin_router", "decisions_router", "export_router", "health_router"]
''',
    'backend/db/__init__.py': '',
    'backend/db/migrations/__init__.py': '',
    'backend/tests/__init__.py': '',
    'backend/ws/__init__.py': '',
}
for path, content in files.items():
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Written: {path}')
