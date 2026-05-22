import random
import string
from django.db import models
from django.utils import timezone


class ApplicationType(models.TextChoices):
    RECORDATION = "recordation", "Recordation"
    RENEWAL = "renewal", "Renewal"
    CHANGE_OF_OWNERSHIP = "change_of_ownership", "Change of Ownership"
    CHANGE_OF_NAME = "change_of_name", "Change of Name"
    DISCONTINUATION = "discontinuation", "Discontinuation"


class ApplicationStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    SUBMITTED = "submitted", "Submitted"
    UNDER_REVIEW = "under_review", "Under Review"
    NEED_MORE_INFORMATION = "need_more_information", "Need More Information"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


# Valid transitions map: current_status -> set of allowed next statuses
VALID_TRANSITIONS: dict[str, set[str]] = {
    ApplicationStatus.DRAFT: {ApplicationStatus.SUBMITTED},
    ApplicationStatus.SUBMITTED: {ApplicationStatus.UNDER_REVIEW},
    ApplicationStatus.UNDER_REVIEW: {
        ApplicationStatus.APPROVED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.NEED_MORE_INFORMATION,
    },
    ApplicationStatus.NEED_MORE_INFORMATION: {ApplicationStatus.SUBMITTED},
    ApplicationStatus.APPROVED: set(),
    ApplicationStatus.REJECTED: set(),
}

# Statuses where applicant can edit fields
APPLICANT_EDITABLE_STATUSES = {
    ApplicationStatus.DRAFT,
    ApplicationStatus.NEED_MORE_INFORMATION,
}


def generate_tracking_number() -> str:
    year = timezone.now().year
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"APP-{year}-{suffix}"


class Application(models.Model):
    tracking_number = models.CharField(max_length=20, unique=True, editable=False)
    applicant_name = models.CharField(max_length=255)
    applicant_email = models.EmailField()
    company_name = models.CharField(max_length=255)
    application_type = models.CharField(
        max_length=50,
        choices=ApplicationType.choices,
    )
    description = models.TextField()
    status = models.CharField(
        max_length=30,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.DRAFT,
    )
    reviewer_comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.tracking_number} — {self.applicant_name}"

    def save(self, *args, **kwargs):
        if not self.tracking_number:
            # Ensure uniqueness
            while True:
                candidate = generate_tracking_number()
                if not Application.objects.filter(tracking_number=candidate).exists():
                    self.tracking_number = candidate
                    break
        super().save(*args, **kwargs)

    def can_transition_to(self, new_status: str) -> bool:
        return new_status in VALID_TRANSITIONS.get(self.status, set())

    def is_editable_by_applicant(self) -> bool:
        return self.status in APPLICANT_EDITABLE_STATUSES
