from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='price',
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal('0.00'),
                help_text='Course price tag',
                max_digits=10
            ),
        ),
    ]
