from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
import uuid
from django.utils import timezone
from datetime import timedelta
from django.db.models import Avg

class CustomUser(AbstractUser):
    phone_number = models.CharField(
        max_length=11,
        validators=[RegexValidator(
            regex=r'^01[0-9]{9}$',
            message='The phone number must be an Egyptian phone number starting with 01 or 011 or 012 or 015 followed by 9 digits.'
        )],
        unique=True,
        null=True,
        blank=True
    )
    email = models.EmailField(unique=True)
    bio = models.TextField(max_length=500, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    last_activity = models.DateTimeField(null=True, blank=True , default=timezone.now)

    def set_password(self, raw_password):
        super().set_password(raw_password)

    def __str__(self):
        return f"{self.username} - {self.phone_number}"

class Teacher(models.Model):
    name = models.CharField(max_length=100)
    governorate = models.CharField(max_length=50)
    grade = models.JSONField(default=list)
    subject = models.CharField(max_length=50)
    price_per_session = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    max_students_per_group = models.IntegerField(default=10)
    schedule = models.JSONField(default=dict)
    promotional_videos = models.URLField(max_length=200, blank=True, null=True)
    image = models.ImageField(upload_to='teacher_images/', blank=True, null=True)
    is_top_rated = models.BooleanField(default=False)
    manually_set_top_rated = models.BooleanField(default=False)
    status = models.CharField(  # New field
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('suspended', 'Suspended'),
        ],
        default='active'
    )

    def __str__(self):
        return self.name

    
    @property
    def rating(self):
        ratings = self.rating_set.all()
        total_rating = sum(rating.rating for rating in ratings)
        total_rating = round(float(total_rating), 1) if total_rating else 0.0
        if not self.manually_set_top_rated:
            self.is_top_rated = total_rating >= 5.0
            self.save()
        if self.is_top_rated and not ratings:
            return 5.0
        return min(total_rating, 5.0)

    @property
    def rating_count(self):
        return self.rating_set.count()
    


class RatedTeacher(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["user", "teacher"]  

    def __str__(self):
        return f"{self.user.username} rated {self.teacher.name}"

class Rating(models.Model):
    user = models.ForeignKey('CustomUser', on_delete=models.CASCADE)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    rating = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rating {self.rating} by {self.user} for {self.teacher}"

    def save(self, *args, **kwargs):
        self.rating = self.rating / 10.0
        super(Rating, self).save(*args, **kwargs)
        self.teacher.save()

class Booking(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    date = models.DateField()
    time = models.CharField(max_length=10)  
    place = models.CharField(max_length=100) 
    subject = models.CharField(max_length=50)
    status = models.CharField(
        max_length=20,
        choices=[("confirmed", "Confirmed"), ("modified", "Modified"), ("cancelled", "Cancelled"),("pending", "Pending")],
        default="confirmed"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    rated = models.BooleanField(default=False)
    closed_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Booking for {self.teacher.name} by {self.user.username} on {self.day} at {self.time}"


class PasswordResetToken(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.pk:
            self.expires_at = timezone.now() + timedelta(minutes=15)
        super().save(*args, **kwargs)

    def is_valid(self):
        from django.utils import timezone
        return timezone.now() <= self.expires_at
    


class Notification(models.Model):
    title = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="notifications")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title