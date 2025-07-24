from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from .models import CustomUser, Teacher, Booking, Rating,Notification,RatedTeacher
from rest_framework_simplejwt.exceptions import TokenError
from .serializers import UserSerializer, TeacherSerializer, BookingSerializer, RatingSerializer,NotificationSerializer,RatedTeacherSerializer
from .models import CustomUser, PasswordResetToken
from django.core.mail import send_mail
from datetime import timedelta
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth.hashers import check_password
from datetime import timedelta
import logging
from django.conf import settings
from rest_framework.decorators import api_view , authentication_classes
from rest_framework import generics
from django.utils import timezone
from .authentication import CookieJWTAuthentication
from django.utils.translation import gettext as _
from django.utils.timezone import localtime 
from datetime import datetime
from django.db import transaction

logger = logging.getLogger(__name__)
def is_admin_user(request):
    access_token = request.COOKIES.get('access_token')
    if not access_token:
        return False, Response(
            {'detail': 'Authentication credentials were not provided.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    try:
        token = AccessToken(access_token)
        user_id = token['user_id']
        user = CustomUser.objects.get(id=user_id)
        return (user.is_superuser or user.is_staff), user
    except (TokenError, CustomUser.DoesNotExist):
        return False, Response(
            {'detail': 'Invalid token.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

def is_admin_us(user):
    return user.is_authenticated and (user.is_staff or user.is_superuser)


class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Registration successful!"}, status=status.HTTP_201_CREATED)
        
        error_response = {"message": "Invalid registration data.", "errors": serializer.errors}
        
        if "email" in serializer.errors:
            error_response["email"] = "Email already in use."
        if "phone_number" in serializer.errors:
            error_response["phone_number"] = "Phone number already in use."
        
        return Response(error_response, status=status.HTTP_400_BAD_REQUEST)



class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_400_BAD_REQUEST)

        if user.check_password(password):
            refresh = RefreshToken.for_user(user)
            serializer = UserSerializer(user)

            access_token_lifetime = timedelta(days=365) 
            refresh_token_lifetime = timedelta(days=365) 

            refresh.set_exp(lifetime=refresh_token_lifetime)


            user.last_activity = timezone.now()
            user.save()

            response = Response({
                'user': serializer.data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })

            response.set_cookie(
                key='access_token',
                value=str(refresh.access_token),
                httponly=True,
                secure=False,
                samesite='Lax',
                max_age=int(access_token_lifetime.total_seconds()),
                path='/',
            )
            response.set_cookie(
                key='refresh_token',
                value=str(refresh),
                httponly=True,
                secure=False,
                samesite='Lax',
                max_age=int(refresh_token_lifetime.total_seconds()),
                path='/',
            )

            return response
        return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_400_BAD_REQUEST)




class CheckAuthView(APIView):
    def get(self, request):
        access_token = request.COOKIES.get('access_token')
        if not access_token:
            return Response({'user': None}, status=status.HTTP_200_OK)

        try:
            token = AccessToken(access_token)
            user_id = token['user_id']
            user = CustomUser.objects.get(id=user_id)

            current_time = timezone.now()
            local_last_activity = localtime(user.last_activity) if user.last_activity else None
            local_current_time = localtime(current_time)

            if user.last_activity:
                time_difference = current_time - user.last_activity
                if time_difference > timedelta(days=4):
                    response = Response({'user': None}, status=status.HTTP_200_OK)
                    response.delete_cookie('access_token')
                    response.delete_cookie('refresh_token')
                    return response

            user.last_activity = timezone.now()
            user.save()
            serializer = UserSerializer(user)
            return Response({
                'user': serializer.data,
                'current_password_hash': user.password,
            }, status=status.HTTP_200_OK)
        except TokenError as e:
            return Response({'user': None}, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({'user': None}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    def post(self, request):
        response = Response({'detail': 'Logged out successfully'})
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response
    

class TeachersView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, pk=None):
        if pk is not None:
            try:
                teacher = Teacher.objects.get(id=pk)
                serializer = TeacherSerializer(teacher)
                return Response(serializer.data)
            except Teacher.DoesNotExist:
                return Response(
                    {"detail": "Teacher not found."},
                    status=status.HTTP_404_NOT_FOUND
                )
        teachers = Teacher.objects.all()
        serializer = TeacherSerializer(teachers, many=True)
        return Response(serializer.data)

    def post(self, request):
        is_admin, response = is_admin_user(request)
        if not is_admin:
            return response

        teacher_name = request.data.get("name")
        if Teacher.objects.filter(name=teacher_name).exists():
            return Response(
                {"detail": "Teacher already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = TeacherSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    def put(self, request, pk=None):
        if pk is None:
            return Response(
                {"detail": "Teacher ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            teacher = Teacher.objects.get(id=pk)
            serializer = TeacherSerializer(teacher, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Teacher.DoesNotExist:
            return Response(
                {"detail": "Teacher not found."},
                status=status.HTTP_404_NOT_FOUND
            )

   
    def delete(self, request, pk=None):
        is_admin, response = is_admin_user(request)
        if not is_admin:
            return response

        if pk is None:
            return Response(
                {"detail": "Teacher ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            teacher = Teacher.objects.get(id=pk)
            teacher.delete()
            return Response(
                {"detail": "Teacher deleted successfully."},
                status=status.HTTP_204_NO_CONTENT
            )
        except Teacher.DoesNotExist:
            return Response(
                {"detail": "Teacher not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
    def patch(self, request, pk=None):
        is_admin, response = is_admin_user(request)
        if not is_admin:
            return response

        if pk is None:
            return Response(
                {"detail": _("Teacher ID is required.")},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            teacher = Teacher.objects.get(id=pk)
            serializer = TeacherSerializer(teacher, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Teacher.DoesNotExist:
            return Response(
                {"detail": _("Teacher not found.")},
                status=status.HTTP_404_NOT_FOUND
            )



class BookingsView(APIView):
    def get(self, request):
        access_token = request.COOKIES.get('access_token')
        if not access_token:
            return Response(
                {'detail': _('لم يتم تقديم بيانات التوثيق.')},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            token = AccessToken(access_token)
            user_id = token['user_id']
            user = CustomUser.objects.get(id=user_id)
            bookings = Booking.objects.filter(user=user).order_by('-created_at')
            serializer = BookingSerializer(bookings, many=True)
            return Response(serializer.data)
        except (TokenError, CustomUser.DoesNotExist) as e:
            return Response(
                {'detail': _('الرمز غير صالح.')},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {'detail': _(f'فشل في جلب الحجوزات: {str(e)}')},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        access_token = request.COOKIES.get('access_token')
        if not access_token:
            return Response(
                {'detail': _('لم يتم تقديم بيانات التوثيق.')},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            token = AccessToken(access_token)
            user_id = token['user_id']
            user = CustomUser.objects.get(id=user_id)
            
            data = request.data.copy()
            
            serializer = BookingSerializer(data=data, context={'user': user})
            if serializer.is_valid():
                booking = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(
                {'detail': _('فشل في إنشاء الحجز.'), 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        except (TokenError, CustomUser.DoesNotExist) as e:
            return Response(
                {'detail': _('الرمز غير صالح.')},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {'detail': _(f'حدث خطأ غير متوقع: {str(e)}')},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request, booking_id=None):
        access_token = request.COOKIES.get('access_token')
        if not access_token:
            return Response(
                {'detail': _('لم يتم تقديم بيانات التوثيق.')},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            token = AccessToken(access_token)
            user_id = token['user_id']
            user = CustomUser.objects.get(id=user_id)
            booking = Booking.objects.get(id=booking_id, user=user)

            action = request.data.get('action')
            if action == 'mark_rated':
                booking.rated = True
                booking.save()
                return Response(
                    {'detail': _('تم وضع علامة تم التقييم على الحجز.')},
                    status=status.HTTP_200_OK
                )
            elif action == 'close_popup':
                booking.closed_time = timezone.now()
                booking.save()
                return Response(
                    {'detail': _('تم إغلاق نافذة الحجز المنبثقة.')},
                    status=status.HTTP_200_OK
                )
            elif action == 'cancel':
                try:
                    time_str = booking.time.strip()
                    time_obj = None
                    for fmt in ["%I:%M %p", "%H:%M", "%H:%M:%S"]:
                        try:
                            time_obj = datetime.strptime(time_str, fmt)
                            break
                        except ValueError:
                            continue

                    if not time_obj:
                        return Response(
                            {'detail': _('تنسيق الوقت غير صالح.')},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    booking_datetime = timezone.make_aware(
                        datetime.combine(booking.date, time_obj.time()),
                        timezone.get_current_timezone()
                    )
                    current_time = timezone.now()
                    time_diff = booking_datetime - current_time

                    if time_diff.total_seconds() / 3600 < 48:
                        return Response(
                            {'detail': _('الإلغاء مسموح فقط قبل 48 ساعة على الأقل من الموعد.')},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except Exception as e:
                    return Response(
                        {'detail': _(f'خطأ في معالجة وقت الحجز: {str(e)}')},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                data = {
                    'status': 'cancelled',
                    'date': booking.date,
                    'time': booking.time,
                    'place': booking.place,
                    'teacher_id': booking.teacher.id,
                    'subject': booking.subject,
                }
                serializer = BookingSerializer(
                    booking,
                    data=data,
                    partial=True,
                    context={'user': user}
                )
                if serializer.is_valid():
                    serializer.save()
                    Notification.objects.create(
                        user=user,
                        title=_('تم إلغاء الحجز'),
                        message=_(
                            f'تم إلغاء حجزك مع {booking.teacher.name} لمادة {booking.subject} في {booking.date} الساعة {booking.time} ({booking.place}).'
                        ),
                        is_read=False
                    )

                    current_bookings = Booking.objects.filter(
                        teacher=booking.teacher,
                        date=booking.date,
                        time=booking.time,
                        place=booking.place,
                        status__in=['confirmed', 'modified']
                    ).count()
                    if current_bookings < booking.teacher.max_students_per_group:
                        pending_booking = Booking.objects.filter(
                            teacher=booking.teacher,
                            date=booking.date,
                            time=booking.time,
                            place=booking.place,
                            status='pending'
                        ).order_by('created_at').first()
                        if pending_booking:
                            pending_booking.status = 'confirmed'
                            pending_booking.save()
                            Notification.objects.create(
                                user=pending_booking.user,
                                title=_('تم تأكيد حجزك'),
                                message=_(
                                    f'حجزك مع {pending_booking.teacher.name} لمادة {pending_booking.subject} في {pending_booking.date} الساعة {pending_booking.time} ({pending_booking.place}) تم تأكيده.'
                                ),
                                is_read=False
                            )

                    return Response(
                        {'detail': _('تم إلغاء الحجز بنجاح.')},
                        status=status.HTTP_200_OK
                    )
                return Response(
                    {'detail': _('فشل في إلغاء الحجز.'), 'errors': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {'detail': _('إجراء غير صالح. استخدم "mark_rated"، "close_popup"، أو "cancel".')},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Booking.DoesNotExist:
            return Response(
                {'detail': _('الحجز غير موجود أو ليس لديك إذن.')},
                status=status.HTTP_404_NOT_FOUND
            )
        except (TokenError, CustomUser.DoesNotExist) as e:
            return Response(
                {'detail': _('الرمز غير صالح.')},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {'detail': _(f'حدث خطأ غير متوقع: {str(e)}')},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CheckScheduleChangesView(APIView):
    def post(self, request, pk):
        try:
            teacher = Teacher.objects.get(pk=pk)
            old_schedule = request.data.get('old_schedule', {})
            new_schedule = request.data.get('new_schedule', {})
            new_slot = request.data.get('new_slot', {})

            if not all(key in new_slot for key in ['date', 'time', 'place']):
                return Response(
                    {'detail': 'New slot must include date, time, and place.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            affected_bookings = []
            bookings = Booking.objects.filter(teacher=teacher, status__in=['confirmed', 'modified'])

            for booking in bookings:
                date_str = booking.date.strftime('%Y-%m-%d')
                time = booking.time
                old_slot_exists = date_str in old_schedule and time in old_schedule[date_str]
                new_slot_changed = (
                    date_str not in new_schedule or
                    time not in new_schedule.get(date_str, {}) or
                    new_schedule[date_str][time] != old_schedule.get(date_str, {}).get(time)
                )

                if old_slot_exists and new_slot_changed:
                    booking.status = 'modified'
                    booking.save()

                    subject = 'Change in Your Booking Schedule'
                    message = (
                        f'Dear {booking.user.first_name},\n\n'
                        f'Your booking with the teacher {teacher.name} (Subject: {booking.subject}) has been rescheduled.\n'
                        f'Old Schedule: {booking.date} at {booking.time} ({booking.place})\n'
                        f'New Schedule: {new_slot["date"]} at {new_slot["time"]} ({new_slot["place"]})\n\n'
                        f'Thank you,\nEduBridge Team'
                    )
                    recipient = booking.user.email
                    send_mail(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL,
                        [recipient],
                        fail_silently=False,
                    )

                    affected_bookings.append({
                        'id': booking.id,
                        'user': {'id': booking.user.id, 'username': booking.user.username, 'email': booking.user.email},
                        'date': date_str,
                        'time': booking.time,
                        'place': booking.place,
                        'new_date': new_slot['date'],
                        'new_time': new_slot['time'],
                        'new_place': new_slot['place'],
                    })

            if not affected_bookings:
                return Response(
                    {'detail': 'No bookings were affected by the schedule change.'},
                    status=status.HTTP_200_OK
                )

            return Response({'affected_bookings': affected_bookings}, status=status.HTTP_200_OK)
        except Teacher.DoesNotExist:
            return Response(
                {'detail': 'Teacher not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'detail': f'Failed to check schedule changes: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class NotifyStudentsView(APIView):
    def post(self, request, pk):
        try:
            teacher = Teacher.objects.get(pk=pk)
            booking_ids = request.data.get('booking_ids', [])
            message = request.data.get('message', '')
            action = request.data.get('action', 'reschedule')

            bookings = Booking.objects.filter(id__in=booking_ids, teacher=teacher)
            if not bookings.exists():
                return Response(
                    {'detail': 'No valid bookings found.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            email_success_count = 0
            email_failed_count = 0

            with transaction.atomic():
                for booking in bookings:
                    if not booking.user.email:
                        booking.status = 'cancelled' if action == 'cancel' else 'modified'
                        booking.save()
                        continue

                    subject = ''
                    full_message = ''
                    if action == 'cancel':
                        subject = 'Cancellation of Your Booking'
                        full_message = (
                            f'Dear {booking.user.username},\n\n'
                            f'We regret to inform you that your booking with the teacher {teacher.name} '
                            f'(Subject: {booking.subject}) scheduled for {booking.date} at {booking.time} '
                            f'({booking.place}) has been cancelled.\n\n'
                            f'Additional Message: {message}\n\n'
                            f'Please check the bookings page to schedule a new session if needed.\n'
                            f'Thank you,\nEduBridge Team'
                        )
                        booking.status = 'cancelled'
                    else:
                        new_slot = request.data.get('new_slot', {})
                        if not all(key in new_slot for key in ['date', 'time', 'place']):
                            return Response(
                                {'detail': 'New slot must include date, time, and place for rescheduling.'},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                        subject = 'Change in Your Booking Schedule'
                        full_message = (
                            f'Dear {booking.user.username},\n\n'
                            f'Your booking with the teacher {teacher.name} (Subject: {booking.subject}) '
                            f'has been rescheduled.\n'
                            f'Old Schedule: {booking.date} at {booking.time} ({booking.place})\n'
                            f'New Schedule: {new_slot["date"]} at {new_slot["time"]} ({new_slot["place"]})\n\n'
                            f'Additional Message: {message}\n\n'
                            f'Please check your email and confirm the new booking or reschedule from the bookings page.\n'
                            f'Thank you,\nEduBridge Team'
                        )
                        booking.status = 'modified'

                    try:
                        send_mail(
                            subject,
                            full_message,
                            settings.DEFAULT_FROM_EMAIL,
                            [booking.user.email],
                            fail_silently=False,
                        )
                        email_success_count += 1
                    except Exception as e:
                        email_failed_count += 1

                    booking.save()

            response_detail = f'Notifications processed: {email_success_count} emails sent successfully, {email_failed_count} failed.'
            return Response({'detail': response_detail}, status=status.HTTP_200_OK)
        except Teacher.DoesNotExist:
            return Response(
                {'detail': 'Teacher not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'detail': f'Failed to process notifications: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class GetBookingsBySlotView(APIView):
    def get(self, request, teacher_id):
        try:
            teacher = Teacher.objects.get(id=teacher_id)
            date = request.query_params.get('date')
            time = request.query_params.get('time')
            place = request.query_params.get('place')
            bookings = Booking.objects.filter(
                teacher=teacher,
                date=date,
                time=time,
                place=place,
                status__in=['confirmed', 'modified']
            )
            serializer = BookingSerializer(bookings, many=True)
            return Response(serializer.data)
        except Teacher.DoesNotExist:
            return Response(
                {'detail': 'Teacher not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'detail': f'Failed to fetch bookings: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )




class RatingsView(APIView):
    def post(self, request):
        access_token = request.COOKIES.get('access_token')
        if not access_token:
            return Response(
                {'detail': 'Authentication credentials were not provided.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            token = AccessToken(access_token)
            user_id = token['user_id']
            user = CustomUser.objects.get(id=user_id)
            data = request.data

            teacher_id = data.get('teacher')
            if not teacher_id:
                return Response(
                    {'detail': 'Teacher ID is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                teacher = Teacher.objects.get(id=teacher_id)
            except Teacher.DoesNotExist:
                return Response(
                    {'detail': 'Teacher does not exist.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = RatingSerializer(data=data, context={'user': user})
            if serializer.is_valid():
                rating = serializer.save(user=user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except (TokenError, CustomUser.DoesNotExist):
            return Response(
                {'detail': 'Invalid token.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

    def get(self, request):
        access_token = request.COOKIES.get('access_token')
        if not access_token:
            return Response(
                {'detail': 'Authentication credentials were not provided.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            token = AccessToken(access_token)
            user_id = token['user_id']
            user = CustomUser.objects.get(id=user_id)
            ratings = Rating.objects.filter(user=user)
            serializer = RatingSerializer(ratings, many=True)
            return Response(serializer.data)
        except (TokenError, CustomUser.DoesNotExist):
            return Response(
                {'detail': 'Invalid token.'},
                status=status.HTTP_401_UNAUTHORIZED
            )



class RatedTeacherView(APIView):
    def get(self, request):
        access_token = request.COOKIES.get('access_token')
        if not access_token:
            return Response(
                {'detail': 'Authentication credentials were not provided.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            token = AccessToken(access_token)
            user_id = token['user_id']
            user = CustomUser.objects.get(id=user_id)
            rated_teachers = RatedTeacher.objects.filter(user=user)
            serializer = RatedTeacherSerializer(rated_teachers, many=True)
            return Response(serializer.data)
        except (TokenError, CustomUser.DoesNotExist) as e:
            return Response(
                {'detail': 'Invalid token.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {'detail': f'Failed to fetch rated teachers: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        access_token = request.COOKIES.get('access_token')
        if not access_token:
            return Response(
                {'detail': 'Authentication credentials were not provided.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            token = AccessToken(access_token)
            user_id = token['user_id']
            user = CustomUser.objects.get(id=user_id)
            
            data = request.data.copy()
            
            serializer = RatedTeacherSerializer(data=data, context={'user': user})
            if serializer.is_valid():
                rated_teacher = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except (TokenError, CustomUser.DoesNotExist) as e:
            return Response(
                {'detail': 'Invalid token.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {'detail': f'An unexpected error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class RefreshTokenView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token not provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            response = Response({'access': access_token})
            response.set_cookie(
                key='access_token',
                value=access_token,
                httponly=True,
                secure=False,  
                samesite='Lax',
                max_age=int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
                path='/',
            )
            return response
        except TokenError:
            return Response(
                {'detail': 'Invalid refresh token.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        

class ForgotPasswordView(APIView):
    def post(self, request):
        email = request.data.get('email')
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({'message': 'If the email exists, a reset link has been sent.'}, status=status.HTTP_200_OK)

        reset_token = PasswordResetToken(user=user)
        reset_token.save()

        reset_link = f"http://localhost:3000/reset-password?token={reset_token.token}"
        email_message = (
            f'{_("Click the link to reset your password")}: {reset_link}\n\n'
            f'{_("This link will expire in 15 minutes.")}'
        )
        send_mail(
            subject=_('Reset Your Password'),
            message=email_message,
            from_email='your-email@gmail.com',
            recipient_list=[email],
            fail_silently=False,
        )

        return Response({'message': 'If the email exists, a reset link has been sent.'}, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            if not reset_token.is_valid():
                reset_token.delete()
                return Response({'detail': 'Token has expired.'}, status=status.HTTP_400_BAD_REQUEST)

            user = reset_token.user
            if user.check_password(new_password):  
                return Response(
                    {'detail': 'New password cannot be the same as the old password.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.set_password(new_password)
            user.save()
            reset_token.delete()  

            return Response({'message': 'Password reset successfully.'}, status=status.HTTP_200_OK)
        except PasswordResetToken.DoesNotExist:
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


      

class ProfileView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        access_token = request.COOKIES.get('access_token')
        if not access_token:
            return Response(
                {'detail': 'Authentication credentials were not provided.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            token = AccessToken(access_token)
            user_id = token['user_id']
            user = CustomUser.objects.get(id=user_id)
            serializer = UserSerializer(user, context={'request': request})
            return Response(serializer.data)
        except (TokenError, CustomUser.DoesNotExist):
            return Response(
                {'detail': 'Invalid token.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

    def put(self, request):
        access_token = request.COOKIES.get('access_token')
        if not access_token:
            return Response(
                {'detail': 'Authentication credentials were not provided.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            token = AccessToken(access_token)
            user_id = token['user_id']
            user = CustomUser.objects.get(id=user_id)
            
            
            data = {
                'first_name': request.data.get('first_name', user.first_name),
                'last_name': request.data.get('last_name', user.last_name),
                'bio': request.data.get('bio', user.bio),
            }
            
            if 'profile_picture' in request.FILES:
                data['profile_picture'] = request.FILES['profile_picture']
            
            serializer = UserSerializer(user, data=data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except (TokenError, CustomUser.DoesNotExist):
            return Response(
                {'detail': 'Invalid token.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {'detail': 'An unexpected error occurred.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    

class SettingsView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    def get(self, request):
        access_token = request.COOKIES.get('access_token')
        if not access_token:
            return Response(
                {'detail': 'Authentication credentials were not provided.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            token = AccessToken(access_token)
            user_id = token['user_id']
            user = CustomUser.objects.get(id=user_id)
            serializer = UserSerializer(user, context={'request': request})
            return Response(serializer.data)
        except (TokenError, CustomUser.DoesNotExist):
            return Response(
                {'detail': 'Invalid token.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

    def put(self, request):
        access_token = request.COOKIES.get('access_token')
        if not access_token:
            return Response(
                {'detail': 'Authentication credentials were not provided.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            token = AccessToken(access_token)
            user_id = token['user_id']
            user = CustomUser.objects.get(id=user_id)
            
            
            data = {
                'first_name': request.data.get('first_name', user.first_name),
                'last_name': request.data.get('last_name', user.last_name),
                'bio': request.data.get('bio', user.bio or ''),
                'password': request.data.get('password', ''),
            }
            
            if data['password']:
                if check_password(data['password'], user.password):
                    return Response(
                        {'error': 'same_old_password'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            
            serializer = UserSerializer(user, data=data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except (TokenError, CustomUser.DoesNotExist):
            return Response(
                {'detail': 'Invalid token.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {'detail': 'An unexpected error occurred.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request):
        access_token = request.COOKIES.get('access_token')
        if not access_token:
            return Response(
                {'detail': 'Authentication credentials were not provided.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            token = AccessToken(access_token)
            user_id = token['user_id']
            user = CustomUser.objects.get(id=user_id)
            user.delete()
            return Response({'detail': 'Account deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except (TokenError, CustomUser.DoesNotExist):
            return Response(
                {'detail': 'Invalid token.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {'detail': 'An unexpected error occurred.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    authentication_classes = [CookieJWTAuthentication]
    
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Notification.objects.filter(user=self.request.user)
        return Notification.objects.none()



@api_view(["GET"])
@authentication_classes([CookieJWTAuthentication])
def unread_count(request):
    
    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        return Response({"unread_count": 0}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        unread_notifications = Notification.objects.filter(user=user, is_read=False)
        unread_count = unread_notifications.count()
        return Response({"unread_count": unread_count})
    except Exception as e:
        return Response(
            {"error": "Failed to fetch unread notifications"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class CreateNotificationView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    
    def post(self, request):
        try:
            if not is_admin_us(request.user):
                return Response({"error": "Only admins can send notifications"}, status=status.HTTP_403_FORBIDDEN)
            
            title = request.data.get('title')
            message = request.data.get('message')
            user_id = request.data.get('user_id')
            send_to_all = request.data.get('send_to_all', False)
            
            if not title or not message:
                return Response({"error": "title and message are required"}, status=status.HTTP_400_BAD_REQUEST)
            
            if send_to_all:
                users = CustomUser.objects.all()
                if not users.exists():
                    return Response({"error": "No users found in the system"}, status=status.HTTP_400_BAD_REQUEST)
                
                notifications = []
                for user in users:
                    notification = Notification.objects.create(
                        user=user,
                        title=title,
                        message=message,
                        is_read=False
                    )
                    notifications.append(notification)
                
                serializer = NotificationSerializer(notifications, many=True)
                return Response({"message": "Notifications sent to all users", "data": serializer.data}, status=status.HTTP_201_CREATED)
            else:
                if not user_id:
                    return Response({"error": "user_id is required when sending to a specific user"}, status=status.HTTP_400_BAD_REQUEST)
                
                try:
                    user_id = int(user_id)
                except (ValueError, TypeError):
                    return Response({"error": "user_id must be a valid integer"}, status=status.HTTP_400_BAD_REQUEST)
                
                try:
                    user = CustomUser.objects.get(id=user_id)
                except CustomUser.DoesNotExist:
                    return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
                
                notification = Notification.objects.create(
                    user=user,
                    title=title,
                    message=message,
                    is_read=False
                )
                serializer = NotificationSerializer(notification)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(["POST"])
@authentication_classes([CookieJWTAuthentication])
def mark_notifications_read(request):
    
    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        Notification.objects.filter(user=user, is_read=False).update(is_read=True)
        return Response({"message": "Notifications marked as read"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {"error": "Failed to mark notifications as read"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class DeleteNotificationView(APIView):
    authentication_classes = [CookieJWTAuthentication]

    def delete(self, request, notification_id):
        try:
            if not request.user.is_authenticated:
                return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

            try:
                notification = Notification.objects.get(id=notification_id, user=request.user)
            except Notification.DoesNotExist:
                return Response({"error": "Notification not found or you do not have permission to delete it"}, status=status.HTTP_404_NOT_FOUND)

            notification.delete()
            return Response({"message": "Notification deleted successfully"}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




class UserDeleteView(APIView):
    def delete(self, request, pk=None):
        is_admin, response = is_admin_user(request)
        if not is_admin:
            return response
        try:
            user = CustomUser.objects.get(id=pk)
            user.delete()
            return Response({"detail": "User deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except CustomUser.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        



class AllUsersView(APIView):
    def get(self, request):
        is_admin, response = is_admin_user(request)
        if not is_admin:
            return response
        users = CustomUser.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def delete(self, request, user_id):
        is_admin, response = is_admin_user(request)
        if not is_admin:
            return response
        try:
            user = CustomUser.objects.get(id=user_id)
            user.delete()
            return Response({"message": "User deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    
class AllBookingsView(APIView):
    def get(self, request):
        is_admin, response = is_admin_user(request)
        if not is_admin:
            return response
        bookings = Booking.objects.all().order_by('-created_at')
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)