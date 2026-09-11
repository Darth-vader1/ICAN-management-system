# Generated for ScheduleTemplate model

import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0002_course_price'),
    ]

    operations = [
        migrations.CreateModel(
            name='ScheduleTemplate',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('course_code', models.CharField(max_length=20)),
                ('course_name', models.CharField(max_length=200)),
                ('level_code', models.CharField(default='foundation', max_length=32)),
                ('day_of_week', models.CharField(default='Saturdays', max_length=30)),
                ('frequency', models.CharField(default='Weekly', max_length=30)),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('tutor_name', models.CharField(blank=True, max_length=150)),
                ('room', models.CharField(default='Room A1', max_length=100)),
                ('status', models.CharField(default='active', max_length=20)),
                ('status_subtext', models.CharField(blank=True, max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('course', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='schedule_templates', to='academics.course')),
            ],
            options={
                'db_table': 'academics_scheduletemplate',
                'ordering': ['level_code', 'course_code'],
            },
        ),
    ]
