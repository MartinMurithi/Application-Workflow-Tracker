from datetime import datetime
from typing import Optional
from ninja import Schema


class ApplicationCreateSchema(Schema):
    applicant_name: str
    applicant_email: str
    company_name: str
    application_type: str
    description: str


class ApplicationUpdateSchema(Schema):
    applicant_name: Optional[str] = None
    applicant_email: Optional[str] = None
    company_name: Optional[str] = None
    application_type: Optional[str] = None
    description: Optional[str] = None


class ApplicationOutSchema(Schema):
    id: int
    tracking_number: str
    applicant_name: str
    applicant_email: str
    company_name: str
    application_type: str
    application_type_display: str
    description: str
    status: str
    status_display: str
    reviewer_comment: Optional[str]
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime]
    reviewed_at: Optional[datetime]

    @staticmethod
    def resolve_application_type_display(obj):
        return obj.get_application_type_display()

    @staticmethod
    def resolve_status_display(obj):
        return obj.get_status_display()


class DecisionSchema(Schema):
    decision: str  # approved | rejected | need_more_info
    comment: Optional[str] = None


class ErrorSchema(Schema):
    detail: str
