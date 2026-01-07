from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_remove_instructor_sujects_lesson_status_and_more'),
    ]

    operations = [
    migrations.SeparateDatabaseAndState(
        database_operations=[],
        state_operations=[
            migrations.RenameField(
                model_name='instructor',
                old_name='sujects',
                new_name='subjects',
            ),
        ],
    ),
]

