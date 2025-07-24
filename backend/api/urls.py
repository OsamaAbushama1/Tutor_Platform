from django.urls import path
from .views import (
    RegisterView, LoginView, CheckAuthView, LogoutView,
    TeachersView, BookingsView, RatingsView,RefreshTokenView,
    ForgotPasswordView, ResetPasswordView,ProfileView,SettingsView,CheckScheduleChangesView,NotifyStudentsView
    ,NotificationListView,unread_count,CreateNotificationView,mark_notifications_read,DeleteNotificationView,RatedTeacherView,AllBookingsView,
    AllUsersView,GetBookingsBySlotView
    
)
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('auth/check/', CheckAuthView.as_view(), name='auth-check'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='token-refresh'),
    path('teachers/', TeachersView.as_view(), name='teachers-list'),
    path('teachers/<int:pk>/', TeachersView.as_view(), name='teacher-detail'), 
    path('ratings/', RatingsView.as_view(), name='ratings'),
    path('bookings/', BookingsView.as_view(), name='bookings'),
    path('bookings/<int:booking_id>/', BookingsView.as_view(), name='booking-detail'),
    path('rated-teachers/', RatedTeacherView.as_view(), name='rated-teachers'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('settings/', SettingsView.as_view(), name='settings'),
    path('teachers/<int:pk>/check-schedule-changes/', CheckScheduleChangesView.as_view(), name='check-schedule-changes'),
    path('teachers/<int:pk>/notify-students/', NotifyStudentsView.as_view(), name='notify-students'),
    path("notifications/", NotificationListView.as_view(), name="notification-list"),
    path("notifications/unread-count/", unread_count, name="unread-count"),
    path("notifications/create/", CreateNotificationView.as_view(), name="create-notification"),
    path("notifications/mark-read/", mark_notifications_read, name="mark-notifications-read"),
    path('notifications/delete/<int:notification_id>/', DeleteNotificationView.as_view(), name='delete-notification'),
    path('bookings/all/', AllBookingsView.as_view(), name='all-bookings'),
    path('teachers/<int:teacher_id>/bookings-by-slot/', GetBookingsBySlotView.as_view(), name='bookings-by-slot'),
    path('users/<int:user_id>/', AllUsersView.as_view(), name='user-detail'),
    path('users/all/', AllUsersView.as_view(), name='all-users'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)