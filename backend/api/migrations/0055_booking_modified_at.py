# Generated by Django 5.1.3 on 2025-05-18 02:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0054_alter_customuser_last_activity'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='modified_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
