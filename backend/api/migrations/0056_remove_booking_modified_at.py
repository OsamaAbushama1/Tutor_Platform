# Generated by Django 5.1.3 on 2025-05-18 02:54

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0055_booking_modified_at'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='booking',
            name='modified_at',
        ),
    ]
