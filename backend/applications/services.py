from django.utils import timezone
from .models import Application, ApplicationStatus


class WorkflowError(Exception):
    """Raised when a workflow transition is invalid."""
    pass


class ApplicationService:

    @staticmethod
    def create_draft(
        applicant_name: str,
        applicant_email: str,
        company_name: str,
        application_type: str,
        description: str,
    ) -> Application:
        app = Application(
            applicant_name=applicant_name,
            applicant_email=applicant_email,
            company_name=company_name,
            application_type=application_type,
            description=description,
            status=ApplicationStatus.DRAFT,
        )
        app.save()
        return app

    @staticmethod
    def update_draft(app: Application, **fields) -> Application:
        if not app.is_editable_by_applicant():
            raise WorkflowError(
                f"Application in status '{app.get_status_display()}' cannot be edited."
            )
        allowed = {"applicant_name", "applicant_email", "company_name", "application_type", "description"}
        for key, value in fields.items():
            if key in allowed:
                setattr(app, key, value)
        app.save()
        return app

    @staticmethod
    def submit(app: Application) -> Application:
        if not app.can_transition_to(ApplicationStatus.SUBMITTED):
            raise WorkflowError(
                f"Cannot submit application in status '{app.get_status_display()}'."
            )
        app.status = ApplicationStatus.SUBMITTED
        app.submitted_at = timezone.now()
        app.save()
        return app

    @staticmethod
    def resubmit(app: Application) -> Application:
        """Re-submission after Need More Information."""
        if app.status != ApplicationStatus.NEED_MORE_INFORMATION:
            raise WorkflowError(
                "Only applications in 'Need More Information' status can be resubmitted."
            )
        app.status = ApplicationStatus.SUBMITTED
        app.submitted_at = timezone.now()
        app.save()
        return app

    @staticmethod
    def start_review(app: Application) -> Application:
        if not app.can_transition_to(ApplicationStatus.UNDER_REVIEW):
            raise WorkflowError(
                f"Cannot start review for application in status '{app.get_status_display()}'."
            )
        app.status = ApplicationStatus.UNDER_REVIEW
        app.save()
        return app

    @staticmethod
    def make_decision(app: Application, decision: str, comment: str | None) -> Application:
        decision_map = {
            "approved": ApplicationStatus.APPROVED,
            "rejected": ApplicationStatus.REJECTED,
            "need_more_info": ApplicationStatus.NEED_MORE_INFORMATION,
        }

        if decision not in decision_map:
            raise WorkflowError(f"Invalid decision '{decision}'. Must be: approved, rejected, need_more_info.")

        new_status = decision_map[decision]

        if not app.can_transition_to(new_status):
            raise WorkflowError(
                f"Cannot move application from '{app.get_status_display()}' to '{new_status}'."
            )

        if decision in ("rejected", "need_more_info") and not comment:
            raise WorkflowError(
                f"A reviewer comment is required when decision is '{decision}'."
            )

        app.status = new_status
        app.reviewer_comment = comment
        app.reviewed_at = timezone.now()
        app.save()
        return app
