# Generated for Announcement model

import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Announcement',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('message', models.TextField()),
                ('target_audience', models.CharField(choices=[('all', 'All Students'), ('foundation', 'Foundation Students'), ('skills', 'Skills Students'), ('professional', 'Professional Students')], default='all', max_length=32)),
                ('channels', models.JSONField(default=list, help_text="Channels used, e.g. ['Email', 'WhatsApp', 'In-App']")),
                ('author_name', models.CharField(blank=True, max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('author', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='announcements', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'notifications_announcement',
                'ordering': ['-created_at'],
            },
        ),
    ]
