# Generated by Django 5.1.3 on 2025-04-25 13:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0013_remove_teacher_first_name_remove_teacher_last_name_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='is_modified',
            field=models.BooleanField(default=False),
        ),
    ]
