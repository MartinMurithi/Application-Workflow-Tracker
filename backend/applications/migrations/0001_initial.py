from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Application",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("tracking_number", models.CharField(editable=False, max_length=20, unique=True)),
                ("applicant_name", models.CharField(max_length=255)),
                ("applicant_email", models.EmailField(max_length=254)),
                ("company_name", models.CharField(max_length=255)),
                ("application_type", models.CharField(
                    choices=[
                        ("recordation", "Recordation"),
                        ("renewal", "Renewal"),
                        ("change_of_ownership", "Change of Ownership"),
                        ("change_of_name", "Change of Name"),
                        ("discontinuation", "Discontinuation"),
                    ],
                    max_length=50,
                )),
                ("description", models.TextField()),
                ("status", models.CharField(
                    choices=[
                        ("draft", "Draft"),
                        ("submitted", "Submitted"),
                        ("under_review", "Under Review"),
                        ("need_more_information", "Need More Information"),
                        ("approved", "Approved"),
                        ("rejected", "Rejected"),
                    ],
                    default="draft",
                    max_length=30,
                )),
                ("reviewer_comment", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("submitted_at", models.DateTimeField(blank=True, null=True)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
