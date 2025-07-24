from rest_framework import serializers
from .models import CustomUser, Teacher, Booking, Rating,Notification,RatedTeacher
from django.utils import timezone
import random
from datetime import datetime
from django.utils.translation import gettext as _


import logging

logger = logging.getLogger(__name__)

class UserSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    phone_number = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    bio = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'first_name', 'last_name', 'phone_number', 'email', 'password', 'is_superuser',
                'is_staff', 'date_joined', 'bio', 'profile_picture', 'username']
        read_only_fields = ['id', 'date_joined', 'is_superuser', 'is_staff', 'username']


    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.profile_picture:
            request = self.context.get('request')
            ret['profile_picture'] = (
                request.build_absolute_uri(instance.profile_picture.url) if request else instance.profile_picture.url
            )
        else:
            ret['profile_picture'] = None
        return ret

    def validate_bio(self, value):
        if value and len(value) > 500:
            raise serializers.ValidationError("Bio must be 500 characters or less.")
        return value

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    def validate_phone_number(self, value):
        if not value.isdigit() or len(value) != 11:
            raise serializers.ValidationError("Phone number must be 11 digits.")
        valid_prefixes = ["010", "011", "012", "015"]
        if value[:3] not in valid_prefixes:
            raise serializers.ValidationError("Phone number must start with 010, 011, 012, or 015.")
        if CustomUser.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("Phone number already in use.")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not any(c.islower() for c in value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not any(c.isupper() for c in value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not any(c.isdigit() for c in value):
            raise serializers.ValidationError("Password must contain at least one number.")
        if not any(c in "!@#$%^&*(),.?\":{}|<>" for c in value):
            raise serializers.ValidationError("Password must contain at least one special character.")
        return value

    def create(self, validated_data):
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        phone_number = validated_data.pop('phone_number')
        email = validated_data['email']

        base_username = f"{first_name.lower()}{last_name.lower()}".replace(" ", "")
        while True:
            username = f"{base_username}{random.randint(100, 999)}"
            if not CustomUser.objects.filter(username=username).exists():
                break

        user = CustomUser.objects.create_user(
            username=username,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            email=email,
            password=validated_data['password']
        )
        return user

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.bio = validated_data.get('bio', instance.bio)
        if 'profile_picture' in validated_data:
            instance.profile_picture = validated_data['profile_picture']
        if 'password' in validated_data and validated_data['password']:
            instance.set_password(validated_data['password'])
        instance.save()
        return instance
    

class TeacherSerializer(serializers.ModelSerializer):
    rating = serializers.ReadOnlyField()
    rating_count = serializers.ReadOnlyField()

    class Meta:
        model = Teacher
        fields = ['id', 'name', 'governorate', 'grade', 'subject', 'price_per_session', 
                  'max_students_per_group', 'schedule', 'promotional_videos', 'image', 
                  'is_top_rated', 'rating', 'rating_count', 'manually_set_top_rated', 'status']

    def create(self, validated_data):
        instance = super(TeacherSerializer, self).create(validated_data)
        if validated_data.get('is_top_rated', False):
            instance.manually_set_top_rated = True
        instance.save()
        return instance

    def update(self, instance, validated_data):
        old_max_students = instance.max_students_per_group
        instance = super(TeacherSerializer, self).update(instance, validated_data)
        new_max_students = validated_data.get('max_students_per_group', old_max_students)
        if new_max_students > old_max_students:
            for date, times in instance.schedule.items():
                for time, place in times.items():
                    current_bookings = Booking.objects.filter(
                        teacher=instance,
                        date=date,
                        time=time,
                        place=place,
                        status__in=['confirmed', 'modified']
                    ).count()
                    available_slots = new_max_students - current_bookings
                    
                    if available_slots > 0:
                        pending_bookings = Booking.objects.filter(
                            teacher=instance,
                            date=date,
                            time=time,
                            place=place,
                            status='pending'
                        ).order_by('created_at')[:available_slots]
                        
                        for booking in pending_bookings:
                            booking.status = 'confirmed'
                            booking.save()
                            Notification.objects.create(
                                user=booking.user,
                                title=_('تم تأكيد حجزك'),
                                message=_(
                                    f'حجزك مع {booking.teacher.name} لمادة {booking.subject} في {booking.date} الساعة {booking.time} ({booking.place}) تم تأكيده.'
                                ),
                                is_read=False
                            )

        if 'is_top_rated' in validated_data:
            instance.manually_set_top_rated = validated_data['is_top_rated']
        instance.save()
        return instance




class BookingSerializer(serializers.ModelSerializer):
    teacher = TeacherSerializer(read_only=True)
    subject = serializers.CharField()
    teacher_id = serializers.PrimaryKeyRelatedField(
        source='teacher', 
        queryset=Teacher.objects.all(), 
        write_only=True,
        error_messages={
            'required': _('معرف المعلم مطلوب.'),
            'does_not_exist': _('المعلم ذو المعرف {value} غير موجود.'),
            'invalid': _('معرف المعلم غير صالح.')
        }
    )
    user = UserSerializer(read_only=True)
    date = serializers.DateField()
    status = serializers.ChoiceField(
        choices=['confirmed', 'modified', 'cancelled', 'pending'],
        required=False
    )

    class Meta:
        model = Booking
        fields = ['id', 'user', 'teacher', 'teacher_id', 'subject', 'date', 'time', 'place', 'status', 'rated', 'closed_time']
        read_only_fields = ['id', 'user', 'teacher', 'rated', 'closed_time']

    def validate(self, data):
        teacher = data.get('teacher')
        date = data.get('date')
        time = data.get('time')
        place = data.get('place')
        status = data.get('status')


        if self.instance and status == 'cancelled':
            if not date or not time:
                raise serializers.ValidationError(_("التاريخ والوقت مطلوبان للإلغاء."))
            
            try:
                time_str = time.strip()
                time_obj = None
                for fmt in ["%I:%M %p", "%H:%M", "%H:%M:%S"]:
                    try:
                        time_obj = datetime.strptime(time_str, fmt)
                        break
                    except ValueError:
                        continue
                
                if not time_obj:
                    raise serializers.ValidationError(
                        _("تنسيق الوقت غير صالح. استخدم 'HH:MM'، 'HH:MM:SS'، أو 'HH:MM AM/PM' (مثال: '14:30'، '14:30:00'، '2:30 PM').")
                    )

                booking_datetime = timezone.make_aware(
                    datetime.combine(date, time_obj.time()),
                    timezone.get_current_timezone()
                )
                current_time = timezone.now()
                time_diff = booking_datetime - current_time

                if time_diff.total_seconds() / 3600 < 48:
                    raise serializers.ValidationError(
                        _("الإلغاء مسموح فقط قبل 48 ساعة على الأقل من الموعد.")
                    )
            except Exception as e:
                raise serializers.ValidationError(_(f"خطأ في معالجة التاريخ أو الوقت: {str(e)}"))

        if not self.instance:
            if not date or not time or not place or not teacher:
                raise serializers.ValidationError(_("التاريخ، الوقت، المكان، والمعلم مطلوبون."))

            try:
                date_str = date.strftime('%Y-%m-%d')
            except AttributeError:
                raise serializers.ValidationError(_("تنسيق التاريخ غير صالح. استخدم 'YYYY-MM-DD' (مثال: '2025-05-19')."))

            if date_str not in teacher.schedule or time not in teacher.schedule[date_str]:
                raise serializers.ValidationError(_("الفتحة الزمنية المختارة غير متوفرة في جدول المعلم."))
            
            if place != teacher.schedule[date_str][time]:
                raise serializers.ValidationError(_("المكان المختار لا يتطابق مع جدول المعلم."))
            
            if data.get('subject') != teacher.subject:
                raise serializers.ValidationError(_("المادة لا تتطابق مع مادة المعلم."))

            current_bookings = Booking.objects.filter(
                teacher=teacher,
                date=date,
                time=time,
                place=place,
                status__in=['confirmed', 'modified']
            ).count()
           
            if Booking.objects.filter(
                teacher=teacher,
                user=self.context.get('user'),
                date=date,
                time=time,
                place=place,
                status__in=['confirmed', 'modified']
            ).exists():
                raise serializers.ValidationError(_("لقد حجزت هذه الفتحة بالفعل."))
            
            if current_bookings >= teacher.max_students_per_group:
                data['status'] = 'pending'
            else:
                data['status'] = 'confirmed'

        return data

    def create(self, validated_data):
        user = self.context.get('user')
        if not user:
            raise serializers.ValidationError(_("المستخدم مطلوب."))
        validated_data['user'] = user
        booking = Booking.objects.create(**validated_data)
        return booking

    def update(self, instance, validated_data):
        instance.status = validated_data.get('status', instance.status)
        instance.save()
        return instance
    

    

class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ['id', 'user', 'teacher', 'rating', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
    
    def validate_rating(self, value):
        if not isinstance(value, (int, float)) or value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be a number between 1 and 5.")
        return value


class RatedTeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = RatedTeacher
        fields = ['id', 'user', 'teacher', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def create(self, validated_data):
        user = self.context.get('user')
        if not user:
            raise serializers.ValidationError("User is required.")
        validated_data['user'] = user
        return RatedTeacher.objects.create(**validated_data)


class NotificationSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True, required=False)
    send_to_all = serializers.BooleanField(write_only=True, default=False)

    class Meta:
        model = Notification
        fields = ["id", "title", "message", "created_at", "is_read", "user_id", "send_to_all"]
        read_only_fields = ["id", "created_at", "is_read"]

    def validate(self, data):
        if not data.get("send_to_all") and not data.get("user_id"):
            raise serializers.ValidationError("Either user_id or send_to_all must be provided.")
        if data.get("send_to_all") and data.get("user_id"):
            raise serializers.ValidationError("Cannot specify user_id when send_to_all is true.")
        if data.get("user_id") and not CustomUser.objects.filter(id=data["user_id"]).exists():
            raise serializers.ValidationError("Invalid user_id.")
        return data

    def create(self, validated_data):
        user_id = validated_data.pop("user_id", None)
        send_to_all = validated_data.pop("send_to_all", False)

        if send_to_all:
            notifications = [
                Notification(**validated_data, user=user)
                for user in CustomUser.objects.all()
            ]
            return Notification.objects.bulk_create(notifications)
        else:
            user = CustomUser.objects.get(id=user_id)
            return Notification.objects.create(**validated_data, user=user)