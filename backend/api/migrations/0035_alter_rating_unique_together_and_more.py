# Generated by Django 5.1.3 on 2025-05-04 14:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0034_booking_session_end_time'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='rating',
            unique_together=set(),
        ),
        migrations.RemoveField(
            model_name='booking',
            name='closed_time',
        ),
        migrations.RemoveField(
            model_name='booking',
            name='rated',
        ),
        migrations.RemoveField(
            model_name='booking',
            name='session_end_time',
        ),
        migrations.AlterField(
            model_name='rating',
            name='rating',
            field=models.IntegerField(),
        ),
    ]
