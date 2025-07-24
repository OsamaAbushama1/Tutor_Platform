from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse


def home(request):
    return HttpResponse("Hello from Django Backend!")

urlpatterns = [
    path('', home, name='home'), 
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)